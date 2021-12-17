export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZHJldzg3IiwiYSI6ImNrcHNwMjg2aTBnN3kyb282dXFhamZvcWgifQ.3hYxNan-zSc5UFL7iOpIZw';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/drew87/ckpspfuua0tts17llzggnjucm',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //add popup
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day: ${loc.day}: ${loc.description}<p/>`)
      .addTo(map);

    //extend bounds
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 200, left: 100, right: 100 },
  });
};
