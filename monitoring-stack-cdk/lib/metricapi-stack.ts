// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import * as elasticsearch from '@aws-cdk/aws-elasticsearch';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as cloudfront from '@aws-cdk/aws-cloudfront';

export interface MetricApiProps {
  elasticsearchDomain: elasticsearch.CfnDomain,
  streamsDistribution: cloudfront.CloudFrontWebDistribution,
}

const lambdaResourcesPath = './resources/lambda-functions';

export class MetricApiStack extends cfn.NestedStack {
  public api: apigateway.RestApi;

  constructor(scope: cdk.Construct, id: string, props: MetricApiProps) {
    super(scope, id);

    const nameLocationMap = new Map<string, string>();
    nameLocationMap.set('callreport', `${lambdaResourcesPath}/sendSoftPhoneReportvenv`);
    nameLocationMap.set('softphonemetrics', `${lambdaResourcesPath}/sendSoftPhoneMetricsvenv`);
    nameLocationMap.set('apimetrics', `${lambdaResourcesPath}/sendAPIMetricReportvenv`);
    const esLayer = new lambda.LayerVersion(this, 'ElasticsearchLayer', {
      code: lambda.Code.fromAsset(`${lambdaResourcesPath}/ESLayer/ESPackage.zip`),
    });
    const elasticsearchPushPermissions = new iam.PolicyStatement({
      actions: ['es:ESHttpPost'],
      resources: [`${props.elasticsearchDomain.attrArn.toString()}/*`],
    });
    const nameFunctionMap = this.createLambdaFunctions(
      nameLocationMap,
      props.elasticsearchDomain.attrDomainEndpoint,
      [esLayer],
      elasticsearchPushPermissions,
      props.streamsDistribution,
    );
    this.api = new apigateway.RestApi(this, 'ElasticsearchApi', {
      restApiName: 'Connect Monitoring API',
      defaultCorsPreflightOptions: {
        allowOrigins: [`https://${props.streamsDistribution.distributionDomainName}`],
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });
    this.createApiEndpoints(nameFunctionMap);
  }

  private createLambdaFunctions(nameLocationMap: Map<string, string>,
    elasticsearchEndpoint: string,
    lambdaLayers: lambda.ILayerVersion[],
    permissions: iam.PolicyStatement,
    streamsDistribution: cloudfront.CloudFrontWebDistribution) {
    const nameFunctionMap = new Map<string, lambda.Function>();
    nameLocationMap.forEach((location, name) => {
      const lambdaFunction = new lambda.Function(this, name, {
        runtime: lambda.Runtime.PYTHON_3_7,
        code: lambda.Code.fromAsset(location),
        handler: 'lambda_function.lambda_handler',
        timeout: cdk.Duration.seconds(60),
        environment: {
          ENDPOINT: elasticsearchEndpoint,
          REGION: cdk.Stack.of(this).region,
          CLOUDFRONT_URL: `https://${streamsDistribution.distributionDomainName}`,
        },
        layers: lambdaLayers,
      });
      lambdaFunction.addToRolePolicy(permissions);

      nameFunctionMap.set(name, lambdaFunction);
    });

    return nameFunctionMap;
  }

  private createApiEndpoints(nameFunctionMap: Map<string, lambda.Function>) {
    /* Create an API Gateway with a Lambda Proxy endpoint using logHandler */
    nameFunctionMap.forEach((lambdaFunction, endpointName) => {
      const apiResource = this.api.root.addResource(endpointName);
      const apiIntegration = new apigateway.LambdaIntegration(lambdaFunction);
      apiResource.addMethod('POST', apiIntegration);
    });
    return this.api;
  }
}
