const AutotagDefaultWorker = require('./autotag_default_worker');
const AWS = require('aws-sdk');
const co = require('co');

class AutotagAutoscaleWorker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
  }

  /* tagResource
  ** method: tagResource
  **
  ** Add tag to autoscaling groups
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let credentials = yield _this.assumeRole();
      _this.autoscaling = new AWS.AutoScaling({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagAutoscalingGroup();
    });
  }

  tagAutoscalingGroup() {
    let _this = this;
    return new Promise(function(resolve, reject) {
      try {
        let tagConfig = _this.getAutotagPair()
        tagConfig.ResourceId = _this.getAutoscalingGroupName();
        tagConfig.ResourceType = 'auto-scaling-group';
        tagConfig.PropagateAtLaunch = true;
        _this.autoscaling.createOrUpdateTags({
          Tags: [
            tagConfig
          ]
        }, function(err, res) {
          if (err)
            reject(err);
          else
            resolve(true);
        });
      } catch(e) {
        reject(e);
      }
    });
  }

  getAutoscalingGroupName() {
    return this.event.requestParameters.autoScalingGroupName;
  }
};

export default AutotagAutoscaleWorker;
