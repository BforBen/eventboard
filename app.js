const path = require('path');
const serve = require('koa-static');
const views = require('koa-views');
const Koa = require('koa');
const got = require('got');
const moment = require('moment');
const app = module.exports = new Koa();

const eventbriteToken = 'RARSEGFMQAXJDBHHZFEC';

const eventsUrl = 'https://www.eventbriteapi.com/v3/users/me/events/?order_by=start_asc&time_filter=current_future&token=' + eventbriteToken;
const eventDetailsUrl = 'https://www.eventbriteapi.com/v3/events/{{eventId}}/?expand=ticket_availability,ticket_classes&token=' + eventbriteToken;

// Init views
app.use(views(path.join(__dirname, '/views'), { extension: 'ejs' }));

// Serve static files
app.use(serve(path.join(__dirname, '/public')));

app.use(async function(ctx) {

  const events = [];

  const eventRequest = await got(eventsUrl);
  const eventData = JSON.parse(eventRequest.body);

  for (const e of eventData.events) {

    const eventDetailRequest = await got( eventDetailsUrl.replace("{{eventId}}", e.id) );
    const eventDetail = JSON.parse(eventDetailRequest.body);
    
    const eventDate = moment(e.start.local);

    events.push({
      "id": e.id,
      "title": e.name.text,
      "url": e.url,
      "date": eventDate.format('ddd do MMM'),
      "fromNow": eventDate.fromNow(),
      "capacity": e.capacity,
      "sold_out": eventDetail.ticket_availability.is_sold_out,
      //"tickets": []
    });
  };
  
  await ctx.render('events', { events });
});

if (!module.parent) app.listen(process.env.PORT);

/*"ticket_classes": [
        {
            "resource_uri": "https://www.eventbriteapi.com/v3/events/52670982326/ticket_classes/98161077/", 
            "variant_id": null, 
            "name": "Local authority staff/ councilor", 
            "description": null, 
            "donation": false, 
            "free": true, 
            "minimum_quantity": 1, 
            "maximum_quantity": null, 
            "maximum_quantity_per_order": 10, 
            "maximum_quantity_per_order_without_pending": null, 
            "on_sale_status": "AVAILABLE", 
            "quantity_total": 60, 
            "quantity_sold": 20, 
            "sales_start": "2018-11-15T07:50:00Z", 
            "sales_end": "2019-02-20T09:00:00Z", 
            "hidden": false, 
            "include_fee": false, 
            "split_fee": false, 
            "hide_description": true, 
            "auto_hide": false, 
            "variants": [], 
            "has_pdf_ticket": true, 
            "sales_channels": [
                "online", 
                "atd"
            ], 
            "delivery_methods": [
                "electronic"
            ], 
            "event_id": "52670982326", 
            "id": "98161077"
        }*/
