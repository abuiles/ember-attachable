import DS from 'ember-data';
import Attachable from '../mixins/attachable';

export default DS.Model.extend(Attachable,{

  attachmentAs: 'cover',

  title: DS.attr('string'),
  coverUrl: DS.attr('string'),
  publishedAt: DS.attr('date'),

  embeddedDataA1: DS.attr('string'),
  embeddedDataB1: DS.attr('string'),
  embeddedDataB21: DS.attr('string')

});
