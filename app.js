const path = require('path');
const serve = require('koa-static');
const views = require('koa-views');
const Koa = require('koa');
const got = require('got');
const moment = require('moment');
const app = module.exports = new Koa();

const eventbriteToken = process.env.EVENTBRITE_API_KEY;

const eventsUrl = 'https://www.eventbriteapi.com/v3/users/me/events/?order_by=start_asc&time_filter=current_future&token=' + eventbriteToken;
const eventDetailsUrl = 'https://www.eventbriteapi.com/v3/events/{{eventId}}/?expand=ticket_availability,ticket_classes&token=' + eventbriteToken;

// Init views
app.use(views(path.join(__dirname, '/views'), { extension: 'ejs' }));

// Serve static files
app.use(serve(path.join(__dirname, '/public')));

app.use(async function(ctx) {

  if (ctx.path === '/') {
    const events = [];
  
    const eventRequest = await got(eventsUrl);
    const eventData = JSON.parse(eventRequest.body);
  
    for (const e of eventData.events) {
  
      const eventDetailRequest = await got( eventDetailsUrl.replace("{{eventId}}", e.id) );
      const eventDetail = JSON.parse(eventDetailRequest.body);
      
      const eventDate = moment(e.start.local);
      
      const eventTickets = [];
      
      var sold = 0;
      
      for (const c of eventDetail.ticket_classes) {
        
        sold = sold + c.quantity_sold;
        
        eventTickets.push({
          "class": c.name,
          "total": c.quantity_total,
          "sold": c.quantity_sold
        });
      }
  
      events.push({
        "id": e.id,
        "title": e.name.text,
        "url": e.url,
        "date": eventDate.format('ddd do MMM'),
        "fromNow": eventDate.fromNow(),
        "capacity": e.capacity,
        "sold": sold,
        "sold_out": eventDetail.ticket_availability.is_sold_out,
        "tickets": eventTickets
      });
    };
    
    await ctx.render('events', { events });
  }
});

if (!module.parent) app.listen(process.env.PORT);
