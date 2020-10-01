// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

var aws = require('aws-sdk')
var cfnResponse = require('./cfn-response')
var codeBuild = new aws.CodeBuild();

exports.handler = async function(event, context) {
    console.log(JSON.stringify(event, 0, 4) + '')
    if(event.RequestType.toLowerCase() === 'create' || event.RequestType.toLowerCase() === 'update') {
        try {
            // Trigger a new CDK deploy
            var buildResponse = await codeBuild.startBuild({
                projectName: process.env.ProjectName,
                environmentVariablesOverride: [{
                    name: "CFN_RESPONSE_DATA",
                    value: JSON.stringify({event: event, context: context})
                }]
            }).promise();
        }
        catch (err) {
            console.log(err);
            await cfnResponse.send(event, context, cfnResponse.FAILED, {'error': err})
        }
    } 
    else {
        await cfnResponse.send(event, context, cfnResponse.SUCCESS, {})
    }
}  