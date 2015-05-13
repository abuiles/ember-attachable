import DS from 'ember-data';

export default DS.ActiveModelSerializer.extend({
  serialize: function(magazine) {
    var json = {
      title: magazine.attr('title'),
      cover_url: magazine.attr('coverUrl'),
      published_at: magazine.attr('publishedAt'),
      embbeded_data: {
        embedded_data_a: {
          embedded_data_a_1: magazine.attr('embeddedDataA1'),
        },
        embedded_data_b: {
          embedded_data_b_1: magazine.attr('embeddedDataB1'),
          embedded_data_b_2:{
            embedded_data_b_2_1: magazine.attr('embeddedDataB21')
          }
        }
      }
    };
    return json;
  }
});
