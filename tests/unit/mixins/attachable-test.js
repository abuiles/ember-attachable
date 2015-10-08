import  Ember from 'ember';
import DS from 'ember-data';
import { test, moduleForModel } from 'ember-qunit';

var fileBlob,
    server;

moduleForModel('user', 'User model with attachement', {

  needs: 'adapter:application',

  setup: function(){
    // PhantomJS doesn't support Blob
    // var content = '<a id="a"><b id="b">hey!</b></a>';
    // fileBlob = new Blob([content], { type: "text/xml"});
    fileBlob = 'BLOB';

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

      var constructorName = request.requestBody.constructor.name;
      if (constructorName){
        equal(constructorName, 'FormData', 'Should be instance of FormData');
      }else{
        ok(true, "Can't assert constructor of FormData instance in PhantomJs");
      }

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

  let userModel = this.subject();
  userModel.set('file', fileBlob);

  let result;
  Ember.run(function(){
    result = userModel.saveWithAttachment();
  });

  result.then(function(createdUser){
    ok(createdUser.get('isLoaded'), 'record is in isLoaded state');
    equal(createdUser.get('id'), 1, 'id is set');
    equal(createdUser.get('fileUrl'), 'path/to/upload_file', 'fileUrl attr should be set from response payload');
  });
});

test('updates model with attachment', function(){
  expect(4);

  server = new Pretender(function(){
    this.put('/users/1', function(request){

      var constructorName = request.requestBody.constructor.name;
      if (constructorName){
        equal(constructorName, 'FormData', 'Should be instance of FormData');
      }else{
        ok(true, "Can't assert constructor of FormData instance in PhantomJs");
      }

      return [ 200,
      {
        "Content-Type": "application/json"
      },
      JSON.stringify({
        user: {
          id: 1,
          fileUrl: 'path/to/upload_file1'
        }
      })
      ];
    });
  });

  var store = this.subject().get('store');

  Ember.run(function(){
    store.push('user', {
      id: 1,
      firstName: 'John'
    });
  });

  let userModel = this.subject().get('store').getById('user', 1);
  userModel.set('file', fileBlob);

  let result;

  Ember.run(function(){
    result = userModel.saveWithAttachment();
  });

  result.then(function(createdUser){
    ok(createdUser.get('isLoaded'), 'record is in isLoaded state');
    equal(createdUser.get('id'), 1, 'id is set');
    equal(createdUser.get('fileUrl'), 'path/to/upload_file1', 'fileUrl attr should be updated from response payload');
  });
});

test('save model with attachment but fails', function(){
  expect(1);

  server = new Pretender(function(){
    this.post('/users', function(){
      return [ 422,
        {
          "Content-Type": "application/json"
        },
        JSON.stringify({
          "errors": {
            "file": ['File is invalid']
          }
        })
      ];
    });
  });

  let userModel = this.subject();
  userModel.set('file', fileBlob);

  let result;
  Ember.run(function(){
    result = userModel.saveWithAttachment();
  });

  result.then(null, function(){
    deepEqual(userModel.get('errors.messages'), ['File is invalid'], 'errors property should be set from response payload');
  });
});

moduleForModel('book', 'Book model with attachements', {

  needs: 'adapter:application',

  setup: function(){
    // PhantomJS doesn't support Blob
    // var content = '<a id="a"><b id="b">hey!</b></a>';
    // fileBlob = new Blob([content], { type: "text/xml"});
    fileBlob = 'BLOB';

    // stub upload progress
    FakeXMLHttpRequest.prototype.upload = {};
  },

  teardown: function(){
    if (server){
      server.shutdown();
    }
  }

});

test('saves model with multiple attachments', function(){
  expect(4);

  server = new Pretender(function(){
    this.post('/books', function(){

      return [ 200,
        {
          "Content-Type": "application/json"
        },
        JSON.stringify({
          book: {
            id: 1,
            coverUrl: 'path/to/cover',
            figureUrls: ['path/to/figure_1', 'path/to/figure_2']
          }
        })
      ];
    });
  });

  let bookModel = this.subject();
  bookModel.set('cover', fileBlob);
  bookModel.set('figures', [fileBlob, fileBlob]);

  let result;
  Ember.run(function(){
    result = bookModel.saveWithAttachment();
  });

  result.then(function(createdBook){
    ok(createdBook.get('isLoaded'), 'record is in isLoaded state');
    equal(createdBook.get('id'), 1, 'id is set');
    equal(createdBook.get('coverUrl'), 'path/to/cover', 'coverUrl attr should be set from response payload');
    deepEqual(createdBook.get('figureUrls'), ['path/to/figure_1', 'path/to/figure_2'], 'figureUrls attr should be set from response payload');
  });
});

moduleForModel('post', 'Post model with attachment and ActiveModelAdapter', {

  needs: 'adapter:post',

  setup: function(){
    // PhantomJS doesn't support Blob
    // var content = '<a id="a"><b id="b">hey!</b></a>';
    // fileBlob = new Blob([content], { type: "text/xml"});
    fileBlob = 'BLOB';

    // stub upload progress
    FakeXMLHttpRequest.prototype.upload = {};
  },

  teardown: function(){
    if (server){
      server.shutdown();
    }
  }

});

test('save model with attachment but fails', function(){
  expect(1);

  server = new Pretender(function(){
    this.post('/posts', function(){

      return [ 422,
               {
                 "Content-Type": "application/json"
               },
               JSON.stringify({
                 "errors": {
                   "photo": ['Photo is invalid']
                 }
               })
             ];
    });
  });

  let post = this.subject();
  post.set('photo', fileBlob);

  let result;
  Ember.run(function(){
    result = post.saveWithAttachment();
  });
  result.then(null, function(){
    if(DS.VERSION === '1.0.0-beta.16'){
      deepEqual(post.get('errors.messages'), [{'photo': ['Photo is invalid']}], 'errors property should be set from response payload');
    }else{
      deepEqual(post.get('errors.messages'), ['Photo is invalid'], 'errors property should be set from response payload');
    }
  });
});

moduleForModel('magazine', 'Magazine model with attachement', {

  needs: ['adapter:magazine','serializer:magazine'],

  setup: function(){
    // PhantomJS doesn't support Blob
    // var content = '<a id="a"><b id="b">hey!</b></a>';
    // fileBlob = new Blob([content], { type: "text/xml"});
    fileBlob = 'BLOB';

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
    this.post('/magazines', function(request){

      var constructorName = request.requestBody.constructor.name;
      if (constructorName){
        equal(constructorName, 'FormData', 'Should be instance of FormData');
      }else{
        ok(true, "Can't assert constructor of FormData instance in PhantomJs");
      }

      return [ 200,
        {
          "Content-Type": "application/json"
        },
        JSON.stringify({
          magazine: {
            id: 1,
            coverUrl: 'path/to/upload_file'
          }
        })
      ];
    });
  });

  let magazineModel = this.subject();
  // magazineModel.set('cover', fileBlob);

  let result;
  Ember.run(function(){

    magazineModel.set('embeddedDataA1', 'embedded data a1');
    magazineModel.set('embeddedDataB1', 'embedded data b1');
    magazineModel.set('embeddedDataB21', 'embedded data b21');


    result = magazineModel.saveWithAttachment();
  });

  result.then(function(createdUser){
    ok(createdUser.get('isLoaded'), 'record is in isLoaded state');
    equal(createdUser.get('id'), 1, 'id is set');
    equal(createdUser.get('coverUrl'), 'path/to/upload_file', 'coverUrl attr should be set from response payload');
  });
});