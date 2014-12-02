# Ember-attachable

[`ember-cli`](https://github.com/stefanpenner/ember-cli) package, which adds attachments support to your Ember-Data models.

## Installing

In the root dir of your project run `npm i ember-attachable --save-dev`,

or you can add `ember-attachable` to your `package.json`:

```javascript
"devDependencies": {
  ...
  "ember-attachable": "latest"
}
```
You may want to be more precise with your version locking.

## Usage

`Ember-attachable` provides a mixin to be included in your models for
adding attachments support. This mixin can be imported from
your app's namespace ( e.g. `./mixins/attachable` ):

```javascript
import Ember from 'ember';
import DS from 'ember-data';

import Attachable from '../mixins/attachable;

export default DS.Model.extend(Attachable, {
  attachment: 'file' // Name of your attachable attribute
});
```

`Ember-attachable` internally uses [`FormData API`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
to perform _POST_ request with `Content-Type: multipart/form-data` for transferring attachment.
