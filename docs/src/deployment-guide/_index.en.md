+++
title = "Deployment Guide"
date = 2020-09-30T21:03:27+10:00
weight = 5
chapter = true
pre = "<b>1. </b>"
+++
## Preconditions

1. An AWS account. For steps to create, check: https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/
2. An Amazon Connect instance.  To create a Connect instance, follow this guide: https://docs.aws.amazon.com/connect/latest/adminguide/amazon-connect-instances.html

## Deployment Steps

1. [Click here](https://serverlessrepo.aws.amazon.com/applications/us-west-2/287087860234/AmazonConnectMonitoringSolution) to go to the application page in the AWS Serverless Repository (SAR). 
2. Click the deploy button on the right.

{{< img "SAR-app-screenshot.png" "Serverless Application Repository" >}}

1. You will be directed to the deployment page, which include a ReadMe and Application settings. 

{{% notice note %}}
By default, the application will be deployed in us-east-1 region, change the AWS console via the region drop down in the top right of the console to your desired region to deploy this solution to another region. The solution works in all regions Amazon Connect is available in. 

{{% /notice %}}

{{< img "SAR-deploy-page.png" "SAR deploy page" >}}

1. Put the CCP url,  in the Application settings, tick the check box and deploy.

{{% notice warning %}}
CcpUrl: The URL in the format https://*/ccp-v2. 
{{% /notice %}}
{{% notice warning %}}
Note that the CCP-v2 must be used.
{{% /notice %}}

{{< img "SAR-deploy-params.png" "SAR deploy params" >}}


{{% notice info %}}
If your Amazon Connect requires SAML federation please provide SAML login URL in the SAML URL parameter. 
{{% /notice %}}

{{% notice note %}}
Please allow up to 45 minutes for the solution to deploy. 
{{% /notice %}}




Once the SAR app has finished to deploy. 

1. The output URLs of the resources are stored in the Parameter store, go to the region for SSM parameter store where you’ve launched the stack
    1. Example URL for us-west-2:  [https://console.aws.amazon.com/systems-manager/parameters/?region=us-west-2&tab=Table](https://us-west-2.console.aws.amazon.com/systems-manager/parameters/?region=us-west-2&tab=Table)
2. In the SSM parameters there is:
    1. URL to create a user from the created Amazon Cognito User Pool (UserCreationUrl)
    2. Kibana URL (KibanaUrl) where you can open up the dashboard,
    3. Cloudfront URL you must whitelist in the Amazon Connect application whitelisting setting.

Creating a user in the user pool is necessary to access Kibana. Following the Kibana URL, you will gain access to the visual user interface for the data stored in ElasticSearch.

1. Click the UserCreationUrl and follow the steps create a user for Kibana
    1. Cognito here is used to manage access to Kibana, the users created in the Cognito User pool are sepereate users to the users from Amazon Connect. 
2. Go to [AWS Console → Amazon Connect](https://console.aws.amazon.com/connect/home?region=us-east-1), choose the Connect instance and insert the Cloudfront URL in the application integration section by clicking on the “add origin” button. 

{{< img "Allowlist-CF.png" "Add Origin" >}}

1. Click the Cloudfront URL, this should open the custom CCP website.
2. Login with your connect user and make/receive a call
3. Metrics will be published and visible in you the Kibana Dashboard


For more details on how to use the solution please check out the [user guide]({{< ref "user-guide/_index.en.md" >}} "User Guide").







