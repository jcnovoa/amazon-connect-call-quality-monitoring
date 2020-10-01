# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import os
from elasticsearch import Elasticsearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
from elasticsearch.helpers import bulk
import boto3

def lambda_handler(event, context):    
    print(event)
    body = json.loads(event['body'])

    body['agentPublicIp'] = event['requestContext']['identity']['sourceIp']
    callConfig = json.loads(body.pop('callConfigJson'))
    body['signalingEndpoint'] = callConfig['signalingEndpoint']
    add_ice_servers(body, callConfig)
    
    #TO DO make the numbers in the report from string to numbers
    es = generate_new_signed_connection()
    es.index(index='softphonecallreport-', doc_type='document', body=body)
    print('Successfully uploaded call report')

    return {
        'statusCode': '200',
        'headers': {
            'Access-Control-Allow-Origin': os.environ['CLOUDFRONT_URL'],
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers':'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
        },
        "body": "Success"
    }

def generate_new_signed_connection():
    host = os.environ.get('ENDPOINT')
    region = os.environ.get('REGION')
    service = 'es'
    credentials = boto3.Session().get_credentials()
    awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)
    print('Creating Elasticsearch connection')
    return Elasticsearch(
        hosts = [{'host': host, 'port': 443}],
        http_auth = awsauth,
        use_ssl = True,
        verify_certs = True,
        connection_class = RequestsHttpConnection
    )

def add_ice_servers(body, callConfig):
    iceServersConfig = callConfig['iceServers']
    iceServers = []
    for item in iceServersConfig:
        iceServers.append(str(item['urls'][0]).replace("?transport=udp", ""))
    iceServers = ", ".join(iceServers)
    body['iceServers'] = iceServers
    return body
