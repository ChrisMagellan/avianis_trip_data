(function() {

  return {
    events: {
      'app.activated'             : 'onActivated',
      'ticket.save'               : 'onActivated',
      'getTripData.done'          : 'getTripDataDone',
      'getTripData.fail'          : 'getTripDataFail',
      'updateTicket.fail'         : 'updateTicketFail',

      'click .add_ticket_details' : 'addTicketFields'
    },

    requests: {
    	getTripData: function(trip_number){
    		return {
    			url: 'https://magellan-bi-staging.herokuapp.com/api/v1/trip_data/' + trip_number + '.json',
    			//url: 'https://compass-chrismagellan.c9.io/api/v1/trip_data/' + trip_number + '.json',
          dataType: 'json',
    			type: 'GET',
          headers: {
            "X-Compass-API-Token": this.APIToken()
          }
    		};
    	},
      updateTicket: function(id, data){
        return {
          url: '/api/v2/tickets/'+ id +'.json',
          dataType: 'json',
          data: JSON.stringify(data),
          processData: false,
          contentType: 'application/json',
          type: 'PUT'
        };
      }
    },

    onActivated: function() {
    	_.defer(function() {
    		this.loadIfDataReady();
    	}.bind(this));
      this.switchTo('loading');
    },

    loadIfDataReady: function() {
    	if (this.ticket() &&
    		this.ticket().id()){
    		if (this.hasTripNumber())
    			return this.ajax('getTripData', this.tripNumber());
    		this.switchTo('home');
    	} else {
        this.switchTo('new');
      }
    },

    getTripDataDone: function(trip) {
      var save = false;
      if (!this.checkDateEqual(trip.departure_date, this.ticket().customField("custom_field_" + this.departureDateFieldId()))) {
        this.ticket().customField("custom_field_" + this.departureDateFieldId(), trip.departure_date);
        save = true;
      }
      if (!this.checkDateEqual(trip.arrival_date, this.ticket().customField("custom_field_" + this.arrivalDateFieldId()))) {
        this.ticket().customField("custom_field_" + this.arrivalDateFieldId(), trip.arrival_date);
        save = true;
      }

      if (this.ticket().id() && save) {
        this.ajax('updateTicket',
                  this.ticket().id(),
                  { "ticket": { "custom_fields": [
                    { "id": this.departureDateFieldId(), "value": trip.departure_date },
                    { "id": this.arrivalDateFieldId(), "value": trip.arrival_date }
                 ]}});
      }

      this.switchTo('trip_details', trip);
    },

    getTripDataFail: function(data) {
      this.switchTo('trip_data_fail', { notFound: (data.status == 404), statusText: data.statusText });
    },

    updateTicketFail: function(data) {
      this.switchTo('error', data);
    },

    addTicketFields: function(e) {
      e.preventDefault();
      this.ticket().customField("custom_field_" + this.tripNumberFieldId(), this.formTripNumber());
      return this.ajax('getTripData', this.tripNumber());
    },

    hasTripNumber: function() {
      return this.tripNumber() != null;
    },

    tripNumber: function() {
      return this.ticket().customField("custom_field_" + this.tripNumberFieldId());
    },

    tripNumberFieldId: function() {
      return this.setting('trip_number_field');
    },

    departureDateFieldId: function() {
      return this.setting('departure_date_field');
    },

    arrivalDateFieldId: function() {
      return this.setting('arrival_date_field');
    },

    APIToken: function() {
      return this.setting('api_token');
    },

    spinnerOff: function(){
      this.$('.spinner').hide();
    },

    spinnerOn: function(){
      this.$('.spinner').show();
    },

    formTripNumber: function(val) {return this.formGetOrSet('.trip_number', val); },

    formGetOrSet: function(selector, val){
      if (_.isUndefined(val))
        return this.$(selector).val();
      return this.$(selector).val(val);
    },

    checkDateEqual: function(text_date, date_field) {
      return text_date == moment(date_field).utc().format('YYYY-MM-DD');
    }
  };

}());
