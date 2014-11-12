import  Ember from 'ember';
import { test, moduleForModel } from 'ember-qunit';
import Pretender from 'pretender';

var fileBlob,
    server;

moduleForModel('user', 'User model with attachement', {

  needs: 'adapter:application'.w(),

  setup: function(){
    var content = '<a id="a"><b id="b">hey!</b></a>';
    fileBlob = new Blob([content], { type: "text/xml"});

    server = new Pretender(function(){
      this.post('/users', function(request){
        return [ 200,
          {
            "Content-Type": "application/json"
          },
          JSON.stringify({
            user: {
              id: 1,
              fileUrl: 'path/to/upload_file'
            }
          })
        ];
      });
    });

    // stub upload progress
    FakeXMLHttpRequest.prototype.upload = {};
  },

  teardown: function(){
    if (server){
      server.shutdown();
    }
  }

});

test('saves model with attachment', function(){
  expect(1);

  var userModel = this.subject();
  userModel.set('file', fileBlob);

  var result;
  Ember.run(function(){
    result = userModel.saveWithAttachment();
  });

  result.then(function(createdUser){
    equal(createdUser.get('fileUrl'), 'path/to/upload_file', 'fileUrl attr should be set from response payload');
  });
});
