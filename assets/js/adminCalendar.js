$('#calendar').fullCalendar({
    themeSystem: 'bootstrap4',
    header: {
        left: 'prev today',
        center: 'title',
        right: 'next',
    },
    bootstrapFontAwesome: {
        close: 'fa-times',
        prev: 'fa-chevron-left',
        next: 'fa-chevron-right',
        prevYear: 'fa-angle-double-left',
        nextYear: 'fa-angle-double-right'
    },
    aspectRatio: 2.3,
    eventLimit: true, // allow "more" link when too many events
    events: 'https://fullcalendar.io/demo-events.json'
});