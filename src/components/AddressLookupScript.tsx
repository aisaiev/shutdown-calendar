export function AddressLookupScript() {
  const script = `
    (function() {
      let selectedStreetId = null;
      let selectedHouseId = null;
      let streetDebounce = null;
      let houseDebounce = null;

      const streetInput = document.getElementById('street-input');
      const houseInput = document.getElementById('house-input');
      const streetResults = document.getElementById('street-results');
      const houseResults = document.getElementById('house-results');
      const groupResult = document.getElementById('group-result');

      // Street search
      streetInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        clearTimeout(streetDebounce);
        
        if (query.length < 2) {
          streetResults.classList.add('hidden');
          return;
        }

        streetDebounce = setTimeout(async () => {
          try {
            const response = await fetch('/api/streets/search?query=' + encodeURIComponent(query));
            const streets = await response.json();
            
            if (streets.length === 0 || streets.error) {
              streetResults.classList.add('hidden');
              return;
            }

            streetResults.innerHTML = streets.map(street => 
              '<div class="px-4 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0 street-item" data-id="' + street.id + '" data-value="' + street.value + '">' + 
                street.value + 
              '</div>'
            ).join('');
            streetResults.classList.remove('hidden');

            // Add click handlers
            streetResults.querySelectorAll('.street-item').forEach(el => {
              el.addEventListener('click', function() {
                selectedStreetId = this.dataset.id;
                streetInput.value = this.dataset.value;
                streetResults.classList.add('hidden');
                
                // Enable house input
                houseInput.disabled = false;
                houseInput.value = '';
                houseInput.focus();
                
                // Reset house selection
                selectedHouseId = null;
                groupResult.classList.add('hidden');
              });
            });
          } catch (error) {
            console.error('Street search error:', error);
          }
        }, 300);
      });

      // House search
      houseInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        clearTimeout(houseDebounce);
        
        if (!selectedStreetId || query.length === 0) {
          houseResults.classList.add('hidden');
          return;
        }

        houseDebounce = setTimeout(async () => {
          try {
            const response = await fetch('/api/houses/search?streetId=' + selectedStreetId + '&query=' + encodeURIComponent(query));
            const houses = await response.json();
            
            if (houses.length === 0 || houses.error) {
              houseResults.classList.add('hidden');
              return;
            }

            houseResults.innerHTML = houses.map(house => 
              '<div class="px-4 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0 house-item" data-id="' + house.id + '" data-value="' + house.value + '">' + 
                house.value + 
              '</div>'
            ).join('');
            houseResults.classList.remove('hidden');

            // Add click handlers
            houseResults.querySelectorAll('.house-item').forEach(el => {
              el.addEventListener('click', async function() {
                selectedHouseId = this.dataset.id;
                houseInput.value = this.dataset.value;
                houseResults.classList.add('hidden');
                
                // Fetch group
                try {
                  const response = await fetch('/api/address/group?streetId=' + selectedStreetId + '&houseId=' + selectedHouseId);
                  const group = await response.json();
                  
                  if (group.error) {
                    groupResult.querySelector('p').textContent = 'Помилка: не вдалося визначити чергу';
                    groupResult.classList.remove('hidden');
                    return;
                  }
                  
                  const groupId = group.group + '.' + group.subgroup;
                  groupResult.querySelector('p').textContent = 'Ваша черга: ' + groupId;
                  groupResult.classList.remove('hidden');
                  
                  // Scroll to the group in the list
                  setTimeout(() => {
                    const groupCard = document.querySelector('[id="url-' + groupId + '"]');
                    if (groupCard) {
                      const card = groupCard.closest('.rounded-xl');
                      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      card.classList.add('ring-2', 'ring-primary');
                      setTimeout(() => {
                        card.classList.remove('ring-2', 'ring-primary');
                      }, 2000);
                    }
                  }, 1000);
                } catch (error) {
                  console.error('Get group error:', error);
                  groupResult.querySelector('p').textContent = 'Помилка: не вдалося визначити чергу';
                  groupResult.classList.remove('hidden');
                }
              });
            });
          } catch (error) {
            console.error('House search error:', error);
          }
        }, 300);
      });

      // Close dropdowns when clicking outside
      document.addEventListener('click', function(e) {
        if (!e.target.closest('#street-input') && !e.target.closest('#street-results')) {
          streetResults.classList.add('hidden');
        }
        if (!e.target.closest('#house-input') && !e.target.closest('#house-results')) {
          houseResults.classList.add('hidden');
        }
      });
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
