import Ember from 'ember';
import DS from 'ember-data';
import { request } from 'ic-ajax';
import {
  convertResourceObject,
  normalizeResponseHelper,
  _normalizeSerializerPayload
} from 'ember-attachable/lib/serializer-response';

export default Ember.Mixin.create({
  attachmentAs: null,
  saveWithAttachment: function() {
    return this.createWithAttachment();
  },
  createWithAttachment: function() {
    var adapter, attachmentKey, data, formData, promise, root, serializer, url,
    _this = this;
    adapter = this.store.adapterFor(this.constructor);
    serializer = this.store.serializerFor(this._modelName());
    attachmentKey = this.get('attachmentAs');
    data = Ember.copy(this.serialize());

    // For each key set on `attachmentName` we add that key to `data` array
    // with its conrresponding BLOB file.
    Ember.makeArray(attachmentKey).forEach(function(key) {
      data[key] = this.get(key);
    }, this);

    formData = new FormData();
    root = this._rootKey();
    Ember.keys(data).forEach(function(key) {
      if (!Ember.isNone(data[key])) {
        if (Ember.isArray(data[key])) {
          return data[key].forEach(function(val) {
            return formData.append("" + root + "[" + key + "][]", val, val.filename || 'blob');
          });
        }else if(Object.prototype.toString.call(data[key]) === '[object Object]'){
          return _this._recursiveObjectAppend(formData,"" + root + "[" + key + "]",data,key);
        } else {
          return formData.append("" + root + "[" + key + "]", data[key], data[key].filename || 'blob');
        }
      }
    });
    url = adapter.buildURL(this._modelName(), this.get('id'));
    if(this._oldEmberData()){
      this.adapterWillCommit();
    }else{
      this._internalModel.adapterWillCommit();
    }
    promise = request(url, {
      type: this._requestType(),
      data: formData,
      dataType: 'json',
      headers: adapter.get('headers'),
      processData: false,
      contentType: false,
      xhr: function() {
        var xhr;
        xhr = Ember.$.ajaxSettings.xhr();
        xhr.upload.onprogress = function(evt) {
          return _this.set('uploadProgress', evt.loaded / evt.total * 100);
        };
        return xhr;
      }
    });
    return this._commitWithAttachment(promise, adapter, serializer);
  },
  _recursiveObjectAppend: function(formData, appendRoot, data, key) {
    for (var qey in data[key]){
      if (!Ember.isNone(data[key][qey])) {
        if(Object.prototype.toString.call(data[key][qey]) === '[object Object]'){
          this._recursiveObjectAppend(formData,appendRoot + "[" + qey + "]", data[key], qey);
        }else{
          formData.append(appendRoot + "[" + qey + "]", data[key][qey]);
        }
      }
    }
  },
  _rootKey: function() {
    return Ember.String.underscore(Ember.String.decamelize(this._modelName()));
  },
  _requestType: function() {
    if (this.get("isNew")) {
      return "POST";
    } else {
      return "PUT";
    }
  },
  _commitWithAttachment: function(promise, adapter, serializer) {
    var operation, record, store, type, oldEmberData;
    oldEmberData = this._oldEmberData();
    store = this.store;
    record = this;
    type = record.constructor;
    operation = '';
    if (Ember.get(record, "isNew")) {
      operation = "createRecord";
    } else if (Ember.get(record, "isDeleted")) {
      operation = "deleteRecord";
    } else {
      operation = "updateRecord";
    }
    return promise.then((function(adapterPayload) {
      if (oldEmberData) {
        var payload;
        payload = void 0;
        if (adapterPayload) {
          payload = serializer.extract(store, type, adapterPayload, Ember.get(record, "id"), operation);
        } else {
          payload = adapterPayload;
        }
        store.didSaveRecord(record, payload);
      } else{
        store._adapterRun(function() {
          var payload, data;
          var internalModel = record._internalModel;
          if (adapterPayload) {
            payload = normalizeResponseHelper(serializer, store, type, adapterPayload, Ember.get(record, "id"), operation);
            if (payload.included) {
              store.push({ data: payload.included });
            }
            data = convertResourceObject(payload.data);
          }else{
            data = adapterPayload;
          }
          store.didSaveRecord(internalModel, _normalizeSerializerPayload(internalModel.type, data));
        });
      }
      return record;
    }), (function(reason) {
      var error;
      if(adapter.ajaxError){
        error = adapter.ajaxError(reason.jqXHR);
        if (error instanceof DS.InvalidError) {
          store.recordWasInvalid(record, error.errors);
        } else if (error.status === 422){
          store.recordWasInvalid(record, error.responseJSON.errors);
        } else {
          store.recordWasError(record);
        }
      }else{
        error = adapter.handleResponse(reason.jqXHR.status, record._parseResponseHeaders(reason.jqXHR.getAllResponseHeaders()), adapter.parseErrorResponse(reason.jqXHR.responseText));
        if (error instanceof DS.InvalidError) {
          let stateToTransition = record.get('isNew') ? 'created.uncommitted' : 'updated.uncommitted';
          record.transitionTo(stateToTransition);
          let recordModel = record.adapterDidInvalidate ? record : record._internalModel;
          store.recordWasInvalid(recordModel, DS.errorsArrayToHash(error.errors));
        }
      }
      throw reason;
    }), "Uploading file with attachment");
  },
  _parseResponseHeaders: function (headerStr) {
    var headers = {};
    if (!headerStr) {
      return headers;
    }

    var headerPairs = headerStr.split('\u000d\u000a');
    for (var i = 0; i < headerPairs.length; i++) {
      var headerPair = headerPairs[i];
      // Can't use split() here because it does the wrong thing
      // if the header value has the string ": " in it.
      var index = headerPair.indexOf('\u003a\u0020');
      if (index > 0) {
        var key = headerPair.substring(0, index);
        var val = headerPair.substring(index + 2);
        headers[key] = val;
      }
    }

    return headers;
  },
  _oldEmberData: function() {
    return !Ember.isNone(this.adapterWillCommit);
  },
  // Provide backwards compatible modelName implementation
  _modelName: function() {
    if (Ember.isNone(this.constructor.typeKey)) {
      return this.constructor.modelName;
    } else {
      return this.constructor.typeKey;
    }
  }
});