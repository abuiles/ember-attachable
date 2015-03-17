import DS from 'ember-data';
import Attachable from '../mixins/attachable';

export default DS.Model.extend(Attachable,{

  attachmentAs: 'file',

  firstName: DS.attr('string'),
  lastName: DS.attr('string'),
  fileUrl: DS.attr('string')

});
