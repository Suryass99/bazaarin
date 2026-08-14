// Lightweight autocomplete dropdown — no external API, just filters a local
// list of strings as the user types. Used for both the product search box
// ("de" -> "Dell") and the location box ("koch" -> "Kochi, India"), since we
// don't have a Google Maps API key (or a backend to hold one) available in
// this static project.
(function () {
    function attachAutocomplete(input, getSuggestions, onSelect) {
        const wrapper = document.createElement('div');
        wrapper.className = 'autocomplete-wrapper ' + input.className;
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        input.className = 'autocomplete-input';
        input.setAttribute('autocomplete', 'off');

        const list = document.createElement('div');
        list.className = 'autocomplete-list hidden';
        wrapper.appendChild(list);

        function hide() { list.classList.add('hidden'); list.innerHTML = ''; }

        function render(items) {
            list.innerHTML = '';
            if (items.length === 0) { hide(); return; }
            items.slice(0, 6).forEach(item => {
                const opt = document.createElement('div');
                opt.className = 'autocomplete-item';
                opt.textContent = item;
                opt.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    input.value = item;
                    hide();
                    onSelect(item);
                });
                list.appendChild(opt);
            });
            list.classList.remove('hidden');
        }

        input.addEventListener('input', () => {
            const q = input.value.trim().toLowerCase();
            if (!q) { hide(); return; }
            render(getSuggestions(q));
        });
        input.addEventListener('focus', () => {
            const q = input.value.trim().toLowerCase();
            if (q) render(getSuggestions(q));
        });
        input.addEventListener('blur', () => setTimeout(hide, 120));
    }

    function locationSuggestions(query) {
        return cities.filter(c => c.toLowerCase().includes(query));
    }

    function productSuggestions(query) {
        const brands = products.map(p => p.brand);
        const titles = products.map(p => p.title);
        const pool = Array.from(new Set([...brands, ...titles]));
        return pool
            .filter(t => t.toLowerCase().includes(query))
            .sort((a, b) => a.length - b.length);
    }

    window.attachAutocomplete = attachAutocomplete;
    window.locationSuggestions = locationSuggestions;
    window.productSuggestions = productSuggestions;
})();
