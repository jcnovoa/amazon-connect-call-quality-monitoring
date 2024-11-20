// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import * as cloudformation from '@aws-cdk/aws-cloudformation'
import * as ssm from '@aws-cdk/aws-ssm'
import * as fs from 'fs'
import { Stack } from '@aws-cdk/core';
const buildSpecJson = require('../resources/buildspec/buildspec.json');

/**
 * TODO: Clean up strings and raw json into files in /lib/static
 */
export class DeploymentCdkResourcesStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    cdk.Stack.of(this).addTransform('AWS::Serverless-2016-10-31')

    var ccpUrlParameter = new cdk.CfnParameter(this, 'CcpUrl', {
      type: "String",
      description: "The URL of your softphone."
    });

    var samlUrlParameter = new cdk.CfnParameter(this, 'SamlUrl', {
      type: "String",
      description: "The SAML URL for your instance. Leave empty if you aren't using SAML.",
      default: ''
    });

    var cdkProject = new codebuild.Project(this, 'CDK Builder', {
      buildSpec: codebuild.BuildSpec.fromObject(buildSpecJson),
      environmentVariables: {
        "CCP_URL": {value: ccpUrlParameter.valueAsString},
        "SAML_URL": {value: ccpUrlParameter.valueAsString},
      },
    });

  
    
    const managedPolicies = [
      'CloudFrontFullAccess',
      'AWSCloudFormationFullAccess',
      'AmazonCognitoPowerUser',
      'AmazonDynamoDBFullAccess',
      'AmazonESFullAccess',
      'CloudWatchEventsFullAccess',
      'IAMFullAccess',
      'AWSKeyManagementServicePowerUser',
      'AWSLambdaFullAccess'
    ]

    const suffix = cdk.Fn.select(3, cdk.Fn.split('-', cdk.Fn.select(2, cdk.Fn.split('/', this.stackId))));

    const codeBuildPolicy = new iam.ManagedPolicy(this, 'CDK Deployer Policy', {
      managedPolicyName: 'ConnectMonitoringArtifactAccess' + suffix
    });

    codeBuildPolicy.addStatements(
      iam.PolicyStatement.fromJson({
        "Action": "kinesis:*",
        "Resource": "*",
        "Effect": "Allow"
      }),
      iam.PolicyStatement.fromJson({
        "Action": [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:GetObjectVersion"
        ],
        "Resource": "arn:aws:s3:::amazon-connect-monitoring-test-artifact-bucket",
        "Effect": "Allow"
      }),
      iam.PolicyStatement.fromJson({  
        "Effect": "Allow",
        "Action": [
            "apigateway:*"
        ],
        "Resource": "arn:aws:apigateway:*::/*"
      })
    );

    managedPolicies.forEach(function(policyName) {
      cdkProject.role!.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(policyName)
      );
    })
    codeBuildPolicy.attachToRole(cdkProject.role!)

    var codeBuildTrigger = new lambda.Function(this, "Code Build Trigger", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline(fs.readFileSync('./resources/lambda-functions/cdk-builder/cdkBuilder.js', 'utf-8')),
      handler: 'index.handler',
      environment: {
        'ProjectName': cdkProject.projectName
      },
      timeout: cdk.Duration.minutes(15)
    });
    codeBuildTrigger.role!.addToPolicy(new iam.PolicyStatement({
      resources: [ cdkProject.projectArn ],
      actions: [ "codebuild:StartBuild"]
    }));

    var provider = cloudformation.CustomResourceProvider.fromLambda(codeBuildTrigger);

    var codeBuildResource = new cdk.CfnCustomResource(this, 'CodeBuild Trigger Invoke', {
      serviceToken: provider.serviceToken,
    });

    this.generateOutputAndParam('UserCreationUrl', 'CognitoUrl', codeBuildResource);
    this.generateOutputAndParam('KibanaUrl', 'KibanaUrl', codeBuildResource);
    this.generateOutputAndParam('CloudfrontUrl', 'CloudfrontUrl', codeBuildResource);

    /*new ssm.StringListParameter(this, 'URL List Test', {
      stringListValue: [
        codeBuildResource.getAttString('CognitoUrl'),
        codeBuildResource.getAttString('KibanaUrl'),
        codeBuildResource.getAttString('CloudfrontUrl')
      ],
      parameterName: 'UrlSet'
    }) */
  }

  generateOutputAndParam(parameterName: string, attributeName: string, codeBuildResource: cdk.CfnCustomResource) {
    var attributeValue = Stack.of(this).resolve(codeBuildResource.getAtt(attributeName))
    new cdk.CfnOutput(this, parameterName, {
      value: attributeValue
    });
    new ssm.StringParameter(this, `ssm-${parameterName}`, {
      parameterName: parameterName,
      stringValue: attributeValue
    })
  }
}