// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const aws = require('aws-sdk');
const fs = require('fs');
const FormData = require('form-data');

const region = process.env.AWS_REGION; // e.g. us-west-1

async function sendRequest(requestParams, domainName) {
  console.log(`Sending request to Elasticsearch: ${JSON.stringify(requestParams, 0, 4)}`);
  const request = new aws.HttpRequest(new aws.Endpoint(domainName), region);
  request.method = requestParams.method;
  request.headers = requestParams.headers;
  request.path += requestParams.path;
  request.body = requestParams.body;

  const credentials = new aws.EnvironmentCredentials('AWS');
  const signer = new aws.Signers.V4(request, 'es');
  signer.addAuthorization(credentials, new Date());

  const client = new aws.HttpClient();
  return new Promise((resolve, reject) => {
    client.handleRequest(request, null, (response) => {
      console.log(`${response.statusCode} ${response.statusMessage}`);
      let responseBody = '';
      response.on('data', (chunk) => {
        responseBody += chunk;
      });
      response.on('end', () => {
        console.log(`Response body: ${responseBody}`);
        resolve(responseBody);
      });
    }, (error) => {
      console.log(`Error: ${error}`);
      reject(error);
    });
  });
}

async function createIndices(domainName) {
  const softphoneStreamStatsIndex = {
    method: 'PUT',
    headers: {
      host: domainName,
      'Content-Type': 'application/json;charset=UTF-8',
      Accept: 'application/json',
    },
    path: '_ingest/pipeline/stats_dailyindex',
    body: Buffer.from(JSON.stringify({
      description: 'daily date-time stream metrics index naming',
      processors: [
        {
          date_index_name: {
            field: 'doc.timestamp',
            index_name_prefix: 'softphonestreamstats-',
            date_rounding: 'd',
          },
        },
      ],
    })),
  };

  const softphoneReportStatsIndex = {
    method: 'PUT',
    headers: {
      host: domainName,
      'Content-Type': 'application/json;charset=UTF-8',
      Accept: 'application/json',
    },
    path: '_ingest/pipeline/reports_dailyindex',
    body: Buffer.from(JSON.stringify({
      description: 'daily date-time report index naming',
      processors: [
        {
          date_index_name: {
            field: 'report.callStartTime',
            index_name_prefix: 'softphonecallreport-',
            date_rounding: 'd',
          },
        },
      ],
    })),
  };

  const apiMetricsIndex = {
    method: 'PUT',
    headers: {
      host: domainName,
      'Content-Type': 'application/json;charset=UTF-8',
      Accept: 'application/json',
    },
    path: '_ingest/pipeline/reports_dailyindex',
    body: Buffer.from(JSON.stringify({
      description: 'daily date-time api metric index naming',
      processors: [
        {
          date_index_name: {
            field: 'doc.timestamp',
            index_name_prefix: 'apimetric-',
            date_rounding: 'd',
          },
        },
      ],
    })),
  };

  const indexConfigurations = [
    apiMetricsIndex,
    softphoneReportStatsIndex,
    softphoneStreamStatsIndex,
  ];

  /* complete requests in parallel */
  return Promise.all(indexConfigurations.map((curIndex) => sendRequest(curIndex, domainName)));
}

async function configureKibana(domainName) {
  const body = new FormData();
  body.append('file', fs.readFileSync('./export.ndjson', 'utf8'), 'export.ndjson');
  const kibanaImportRequestParams = {
    method: 'POST',
    headers: {
      ...body.getHeaders(),
      'kbn-xsrf': 'kibana',
      host: domainName,
    },
    path: '_plugin/kibana/api/saved_objects/_import?overwrite=true',
    body: body.getBuffer(),
  };
  return sendRequest(kibanaImportRequestParams, domainName);
}

exports.handler = async (event, context) => {
  console.log(JSON.stringify(event, 0, 4));
  const domainName = event.ResourceProperties.ElasticsearchDomain;
  const indexCreationResult = await createIndices(domainName);
  const resultSet = new Set(indexCreationResult);
  if (resultSet.has('{"acknowledged":true}') && resultSet.size === 1) {
    const kibanaImportResult = await configureKibana(domainName);
    if (JSON.parse(kibanaImportResult).success) {
      return { statusCode: 200, body: 'Successfully imported dashboards and indices' };
    }
    throw new Error('Unable to import dashboards');
  }
  throw new Error('Creating index patterns was not successful. Check logs for details.');
};
