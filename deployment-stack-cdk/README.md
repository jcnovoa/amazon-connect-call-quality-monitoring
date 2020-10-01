# Amazon Connect Monitoring Deployment Guide
## Deploying the app
### CCP URL
This parameter is the URL you use to access the Contact Control Panel. For example, if my instance is named 'monitoring-test' it would be https://monitoring-test.awsapps.com/connect/ccp-v2

### Instance ID
The instance ID can be found by clicking on your instance's name in the Amazon Connect Console. Click on the instance of your region below, and then click on the name of the instance. 
| [Virginia](https://console.aws.amazon.com/connect/home?region=us-east-1) 	| [Oregon](https://console.aws.amazon.com/connect/home?region=us-west-2) 	| [Singapore](https://console.aws.amazon.com/connect/home?region=ap-southeast-1) 	| [Sydney](https://console.aws.amazon.com/connect/home?region=ap-southeast-2) 	| [Tokyo](https://console.aws.amazon.com/connect/home?region=ap-northeast-1) 	| [Frankfurt](https://console.aws.amazon.com/connect/home?region=eu-central-1) 	| [London](https://console.aws.amazon.com/connect/home?region=eu-west-1) 	|
|--------------------------------------------------------------------------	|------------------------------------------------------------------------	|--------------------------------------------------------------------------------	|-----------------------------------------------------------------------------	|----------------------------------------------------------------------------	|------------------------------------------------------------------------------	|------------------------------------------------------------------------	|

After clicking on the name of the instance, you'll find the instance ID in the instance ARN. For example with the ARN:

* arn:aws:connect:us-west-2:287087860234:instance/db454ef4-882a-4d77-8cad-15b8fc0d61e3

The instance ID is

* db454ef4-882a-4d77-8cad-15b8fc0d61e3

Then click deploy! For a guide with pictures please follow the link to our  [GitHub Repo](https://github.com/amazon-connect/amazon-connect-call-quality-monitoring)

## Post-Deploy Steps
### Whitelisting your CloudFront URL
To access the custom metrics-enabled CCP, we also need to whitelist the CloudFront URL from our CCP instance. We can do this from the AWS Console for Connect. From the console where you found your Instance ID
 * Click Application Integration on the left hand side
 * Copy the value from the [CloudFront URL Parameter](https://console.aws.amazon.com/systems-manager/parameters/CloudfrontUrl/description?&tab=Table)
 * Click 'Add Origin'
 * Paste the value
### Creating Cognito Users to View Metrics
Now we need to create Cognito users to access Kibana, the visualization tool to analyze our data and view dashboards.
  * Get the [URL to create users](https://console.aws.amazon.com/systems-manager/parameters/UserCreationUrl/description?&tab=Table)
  * Visit the URL from your browser
  * Click 'Create User' and supply a valid email address. Optionally include a phone number. Require validation as you see fit.
### Access the Kibana Instance
Using the previously created user, we can now view Kibana.
  * Copy the [Kibana URL from the Parameter](https://console.aws.amazon.com/systems-manager/parameters/KibanaUrl/description?&tab=Table)
  * Sign in with the user