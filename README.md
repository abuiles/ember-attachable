# Ember-attachable

Add attachments support to your Ember-Data models.


In your model:

```
import Ember from 'ember';
import DS from 'ember-data';

import Attachable from '../mixins/attachable;

export default DS.Model.extend(Attachable, {
  attachment: 'file' // Name of your attachable attribute
});
```
