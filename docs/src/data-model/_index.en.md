+++
title = "Data Model"
date = 2020-10-01T14:49:42+10:00
weight = 8
chapter = true
pre = "<b>4. </b>"
+++

The solution has three types of index patterns in the Elastic Search cluster. They are:

* apimetric-*
* softphoencallreport-*
* softphonestreamstats-*

### Overview

**apimetric-\*** contains metrics related to the TCP API calls from the softphone. These operations include things such as Accepting a call, changing statues. This the agent’s softphone sends data every 30 seconds while the softphone window is open, regardless if there is an active call. 

**softphonecallreport-\*** contains meta data of the call such as call duration, total number of packets, if there were any signalling failures. This payload is sent at the end of each call when the call terminates. 



**softphonestreamstats-\*** for every second the call is connected, the custom softphone sends two entries data. One for inbound connection and one for outbound connection. Data included are latency for packets, jitter, packet loss etc. This payload is sent every 30 seconds while the call is connected to the softphone. 


### softphonestreamstats-*

The **softphonestreamstats-\*** is the core index where a the real time audio quality monitoring metrics are collected. At a 30 second internal the index is updated with 60 records. 2 records for each second in the previous 30 seconds. One record is for the metrics for audio inbound to the softphone and the second record for the metrics for audio outbound to the softphone. 



Here we provide a brief description of the key attributes in the payload. For detailed explanation for each of the attributes please refer to the WebRTC Stats Standard [[RFC3550](https://www.w3.org/TR/webrtc-stats/#bib-rfc3550)]. For an example payload please check the below.

| Attribute |  Description |
|:--|:--|
| RoundTripTimeMillis |  Estimated round trip time for this channel based on the RTCP timestamps in the RTCP Receiver Report (RR) and measured in seconds. Calculated as defined in section 6.4.1. of [[RFC3550](https://www.w3.org/TR/webrtc-stats/#bib-rfc3550)]. If no RTCP Receiver Report is received with a DLSR value other than 0, the round trip time is left undefined. |
| jitterBufferMillies |  Statistical variance of RTP data packet inter-arrival time (Jitter Buffer) in milliseconds. Calculated as defined in section 6.4.1. of [[RFC3550](https://www.w3.org/TR/webrtc-stats/#bib-rfc3550)].  |
| packetLost |  Number of packets lost after travelling through the channel. Calculated as defined in [[RFC3550](https://www.w3.org/TR/webrtc-stats/#bib-rfc3550)] section 6.4.1. Note that because of how this is estimated, it can be negative if more packets are received than sent.  |
| packetsCount |  Total number of packets sent for this channel. Calculated as defined in [[RFC3550](https://www.w3.org/TR/webrtc-stats/#bib-rfc3550)] section 6.4.1.  |
| audioLevel |  Represents the audio level of the receiving track.  |


{{% notice info %}}
RoundTripTimeMillis is null for “softphoneStreamType": "audio_input"
{{% /notice %}}


#### Audio input payload

```
{
  "_index": "softphonestreamstats-",
  "_type": "document",
  "_id": "xgqCwnQBpmDImy2qLcSG",
  "_version": 1,
  "_score": null,
  "_source": {
    "doc": {
      "contactId": "173518a4-9d74-452d-a83c-0f652e7f422d",
      "agent": "vinesc33",
      "agentPrivateIp": "cb68c546-50ff-4c8b-b227-083670ab8d82.local",
      "agentPublicIp": "205.251.233.178",
      "agentRoutingProfile": "Basic Routing Profile",
      "signalingEndpoint": "wss://rtc.connect-telecom.us-east-1.amazonaws.com/LilyRTC",
      "iceServers": "turn:turnnlb-d76454ac48d20c1e.elb.us-east-1.amazonaws.com.:3478",
      "contactQueue": "BasicQueue",
      "softphoneStreamType": "audio_input",
      "timestamp": "2020-09-24T23:45:43.278Z",
      "packetsLost": 0,
      "packetsCount": 17,
      "audioLevel": 15,
      "jitterBufferMillis": 2,
      "roundTripTimeMillis": null
    }
  },
  "fields": {
    "doc.timestamp": [
      "2020-09-24T23:45:43.278Z"
    ]
  },
  "sort": [
    1600991143278
  ]
}
```

#### Audio output payload
```
{
  "_index": "softphonestreamstats-",
  "_type": "document",
  "_id": "xwqCwnQBpmDImy2qLcSG",
  "_version": 1,
  "_score": null,
  "_source": {
    "doc": {
      "contactId": "173518a4-9d74-452d-a83c-0f652e7f422d",
      "agent": "vinesc33",
      "agentPrivateIp": "cb68c546-50ff-4c8b-b227-083670ab8d82.local",
      "agentPublicIp": "205.251.233.178",
      "agentRoutingProfile": "Basic Routing Profile",
      "signalingEndpoint": "wss://rtc.connect-telecom.us-east-1.amazonaws.com/LilyRTC",
      "iceServers": "turn:turnnlb-d76454ac48d20c1e.elb.us-east-1.amazonaws.com.:3478",
      "contactQueue": "BasicQueue",
      "softphoneStreamType": "audio_output",
      "timestamp": "2020-09-24T23:45:43.278Z",
      "packetsLost": 0,
      "packetsCount": 50,
      "audioLevel": 15,
      "jitterBufferMillis": 1,
      "roundTripTimeMillis": 188
    }
  },
  "fields": {
    "doc.timestamp": [
      "2020-09-24T23:45:43.278Z"
    ]
  },
  "sort": [
    1600991143278
  ]
}
```


### softphonecallreport-*

A call report is generate after a call has disconnected (either successfully or unsuccessfully). The call report contains valuable information to help troubleshoot. 

Here we provide a brief description of the key attributes in the payload. For detailed explanation for each of the attributes please refer to the WebRTC Stats Standard [[RFC3550](https://www.w3.org/TR/webrtc-stats/#bib-rfc3550)]. For an example payload please check the below.

| Attribute |  Description |
|:--|:--|
| gumTimeMillis |  Time taken for grabbing user microphone at the time of connecting RTCSession. |
| initializationTimeMillis |  Time taken for session initialization in millis. Includes time spent in GrabLocalMedia, SetLocalSDP states.  |
| iceCollectionTimeMillis |  Time spent on ICECollection in millis. |
| signallingConnectTimeMillis |  Time taken for connecting the signalling in millis. |
| handshakingTimeMillis |  Times spent in completing handshaking process of the RTCSession in millis. |
| preTalkingTimeMillis |  Times spent from RTCSession connection until entering Talking state in millis. |
| talkingTimeMillis |  Times spent in Talking state in millis. |
| cleanupTimeMillis |  Times spent in Cleanup state in millis |
| iceCollectionFailure |  Tells if the RTCSession fails in ICECollection. |
| signallingConnectionFailure |  Tells if the RTCSession failed in signalling connect stage. |
| handshakingFailure |  Handshaking failure of the RTCSession |
| gumOtherFailure |  Get user media (Gum) failed due to other reasons (other than Timeout) |
| gumTimeoutFailure |  Get user media (Gum) failed due to timeout at the time of new RTCSession connection |
| createOfferFailure|   RTC Session failed in create Offer state |
|setLocalDescriptionFailure|   Tells if setLocalDescription failed for the RTC Session |
| userBusyFailure|  Tells if handshaking failed due to user busy case, can happen when multiple softphone calls are initiated at same time |
| invalidRemoteSDPFailure|   Tells it remote SDP is invalid |
| noRemoteIceCandidateFailure|   A failure case when there is no RemoteIceCandidate |
| setRemoteDescriptionFailure|   Tells if the setRemoteDescription failed for the RTC Session |
| _procMilliseconds |    {number} Processing delay calculated by time to process packet header |
| _rttMilliseconds |    {number} Round trip time calculated with RTCP reports |
| _jbMilliseconds |    {number} Statistical variance of RTP data packet inter-arrival time |
| _bytesSent |    {number} number of bytes sent to the channel |
| _bytesReceived |    {number} number of bytes received from the channel |
| _framesEncoded |   {number} number of video frames encoded |
| _framesDecoded |   {number} number of video frames decoded |
| _frameRateSent |   {number} frames per second sent to the channel |
| _frameRateReceived |   {number} frames per second received from the channel |
| _statsReportType |   {string} the type of the stats report  |
| _streamType |   {string} the type of the stream |
| softphoneStreamType |   {string} the type of the stream |

#### Softphone call report sample payload


```
{
  "_index": "softphonecallreport-",
  "_type": "document",
  "_id": "BumCwnQBFWxktU6WLoMX",
  "_version": 1,
  "_score": null,
  "_source": {
    "agentPrivateIp": "cb68c546-50ff-4c8b-b227-083670ab8d82.local",
    "numberofCpu": 8,
    "localDeviceMemoryLimit": 8,
    "agentBrowserName": "Chrome",
    "agentBrowserversion": "85.0.4183.102",
    "agentRoutingProfile": "Basic Routing Profile",
    "contactQueue": "BasicQueue",
    "contactId": "173518a4-9d74-452d-a83c-0f652e7f422d",
    "report": {
      "callStartTime": "2020-09-24T23:45:18.628Z",
      "softphoneStreamStatistics": [
        {
          "_timestamp": "2020-09-24T23:45:43.278Z",
          "_packetsLost": 1,
          "_packetsCount": 528,
          "_audioLevel": 15,
          "_procMilliseconds": 104,
          "_rttMilliseconds": null,
          "_jbMilliseconds": 2,
          "_bytesSent": null,
          "_bytesReceived": 53378,
          "_framesEncoded": null,
          "_framesDecoded": null,
          "_frameRateSent": null,
          "_frameRateReceived": null,
          "_statsReportType": "ssrc",
          "_streamType": "audio_input",
          "softphoneStreamType": "audio_input"
        },
        {
          "_timestamp": "2020-09-24T23:45:43.278Z",
          "_packetsLost": 14,
          "_packetsCount": 943,
          "_audioLevel": 15,
          "_procMilliseconds": null,
          "_rttMilliseconds": 188,
          "_jbMilliseconds": 1,
          "_bytesSent": 56032,
          "_bytesReceived": null,
          "_framesEncoded": null,
          "_framesDecoded": null,
          "_frameRateSent": null,
          "_frameRateReceived": null,
          "_statsReportType": "ssrc",
          "_streamType": "audio_output",
          "softphoneStreamType": "audio_output"
        }
      ],
      "callEndTime": "2020-09-24T23:45:43.479Z",
      "gumTimeMillis": 5049,
      "initializationTimeMillis": 5066,
      "iceCollectionTimeMillis": 6,
      "signallingConnectTimeMillis": 8,
      "handshakingTimeMillis": 573,
      "preTalkingTimeMillis": 5649,
      "talkingTimeMillis": 19200,
      "cleanupTimeMillis": null,
      "iceCollectionFailure": false,
      "signallingConnectionFailure": false,
      "handshakingFailure": false,
      "gumOtherFailure": false,
      "gumTimeoutFailure": false,
      "createOfferFailure": false,
      "setLocalDescriptionFailure": false,
      "userBusyFailure": false,
      "invalidRemoteSDPFailure": false,
      "noRemoteIceCandidateFailure": false,
      "setRemoteDescriptionFailure": false
    },
    "agent": "vinesc33",
    "externalIp": "205.251.233.178",
    "signalingEndpoint": "wss://rtc.connect-telecom.us-east-1.amazonaws.com/LilyRTC",
    "iceServers": "turn:turnnlb-d76454ac48d20c1e.elb.us-east-1.amazonaws.com.:3478"
  },
  "fields": {
    "report.callEndTime": [
      "2020-09-24T23:45:43.479Z"
    ],
    "report.callStartTime": [
      "2020-09-24T23:45:18.628Z"
    ]
  },
  "sort": [
    1600991118628
  ]
}
```


### apimetrics-*

Sample record below shows it took 25056 milliseconds (25 seconds) for the “`getAgentSnapshot"` API. This is a long poll HTTP and it returns with updates every 30 seconds or if there is an update before the 30 second long poll is finished. There are other APIs (below) where the API call duration is measured, except for the getAgetnSnapshot API they should all return within a short period of time, this depends on your agent’s softphone network connection, however, if the long duration in the API calls here show latency for TCP related networking. 

{{% notice info %}}
Don’t compare different API metric with each other, but one should track these APIs independently. 
{{% /notice %}}

Here is a list of the TCP APIs:
- getAgentSnapshot,
- getAgentConfiguration,
- getAgentPermissions,
- getAgentStates,
- getRoutingProfileQueues,
- getDialableCountryCodes,
- getEndpoints,

Below is an example payload:

```
`{
  "_index": "apimetric",
  "_type": "document",
  "_id": "fYFuunIBPUqLr0ZmuJ-Y",
  "_version": 1,
  "_score": null,
  "_source": {
    "doc": {
      "agent": "abc@xyz.com",
      "queue": "sales",
      "timestamp": "2020-06-16T00:01:57.026Z",
      "getAgentSnapshot": 25056
    }
  },
  "fields": {
    "doc.timestamp": [
      "2020-06-16T00:01:57.026Z"
    ]
  },
  "sort": [
    1592265717026
  ]
}`
```




