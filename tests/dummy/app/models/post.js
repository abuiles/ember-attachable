import DS from 'ember-data';
import Attachable from '../mixins/attachable';

export default DS.Model.extend(Attachable,{

  attachmentAs: 'photo',

  title: DS.attr('string'),
  photoUrl: DS.attr('string')

});
