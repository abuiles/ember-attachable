import DS from 'ember-data';
import Attachable from '../mixins/attachable';

export default DS.Model.extend(Attachable,{

  attachmentAs: ['cover', 'figures'],

  title: DS.attr('string'),
  coverUrl: DS.attr('string'),
  figureUrls: DS.attr()

});
