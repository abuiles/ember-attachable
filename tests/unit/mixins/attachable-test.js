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
  expect(4);

  server = new Pretender(function(){
    this.post('/users', function(request){
      // due to Pretender can't make
      // any other asserts on requestBody
      equal(request.requestBody.constructor.name, 'FormData');
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

  var userModel = this.subject();
  userModel.set('file', fileBlob);

  var result;
  Ember.run(function(){
    result = userModel.saveWithAttachment();
  });

  result.then(function(createdUser){
    ok(createdUser.get('isLoaded'), 'record is in isLoaded state');
    equal(createdUser.get('id'), 1, 'id is set');
    equal(createdUser.get('fileUrl'), 'path/to/upload_file', 'fileUrl attr should be set from response payload');
  });
});
