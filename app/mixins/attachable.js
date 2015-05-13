import Ember from 'ember';
import { request } from 'ic-ajax';

export default Ember.Mixin.create({
  attachmentAs: null,
  saveWithAttachment: function() {
    return this.createWithAttachment();
  },
  createWithAttachment: function() {
    var adapter, attachmentKey, data, formData, promise, root, serializer, url,
    _this = this;
    adapter = this.store.adapterFor(this.constructor);
    serializer = this.store.serializerFor(this.constructor.typeKey);
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
      if (!Ember.isEmpty(data[key])) {
        if (Ember.isArray(data[key])) {
          return data[key].forEach(function(val) {
            return formData.append("" + root + "[" + key + "][]", val);
          });
        }else if(Object.prototype.toString.call(data[key]) === '[object Object]'){
          return _this._recursiveObjectAppend(formData,"" + root + "[" + key + "]",data,key);
        } else {
          return formData.append("" + root + "[" + key + "]", data[key]);
        }
      }
    });
    url = adapter.buildURL(this.constructor.typeKey, this.get('id'));
    this.adapterWillCommit();
    promise = request(url, {
      type: this._requestType(),
      data: formData,
      dataType: 'json',
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
      if(Object.prototype.toString.call(data[key][qey]) === '[object Object]'){
        this._recursiveObjectAppend(formData,appendRoot + "[" + qey + "]", data[key], qey);
      }else{
        formData.append(appendRoot + "[" + qey + "]", data[key][qey]);
      }
    }
  },
  _rootKey: function() {
    return Ember.String.underscore(Ember.String.decamelize(this.constructor.typeKey));
  },
  _requestType: function() {
    if (this.get("isNew")) {
      return "POST";
    } else {
      return "PUT";
    }
  },
  _commitWithAttachment: function(promise, adapter, serializer) {
    var operation, record, store, type;
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
      var payload;
      payload = void 0;
      if (adapterPayload) {
        payload = serializer.extract(store, type, adapterPayload, Ember.get(record, "id"), operation);
      } else {
        payload = adapterPayload;
      }
      store.didSaveRecord(record, payload);
      return record;
    }), (function(reason) {
      var error = adapter.ajaxError(reason.jqXHR);
      if (error instanceof DS.InvalidError) {
        store.recordWasInvalid(record, error.errors);
      } else if (error.status === 422){
        store.recordWasInvalid(record, error.responseJSON.errors);
      } else {
        store.recordWasError(record);
      }
      throw reason;
    }), "Uploading file with attachment");
  }
});
