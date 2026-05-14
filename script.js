let records = JSON.parse(localStorage.getItem('energyRecords')) || [];
document.getElementById('date').valueAsDate = new Date();

const form = document.getElementById('recordForm');
const periodSelect = document.getElementById('period');
const customDates = document.getElementById('custom-dates');
const dateFrom = document.getElementById('date-from');
const dateTo = document.getElementById('date-to');

form.addEventListener('submit', addRecord);
periodSelect.addEventListener('change', handleFilterChange);
dateFrom.addEventListener('change', renderTables);
dateTo.addEventListener('change', renderTables);

function addRecord(e) {
    e.preventDefault();
    
    const category = document.getElementById('category').value; // 'voda', 'plyn', 'elektrina'
    const date = document.getElementById('date').value;
    const value = parseFloat(document.getElementById('value').value);

    const newRecord = { id: Date.now().toString(), category, date, value };

    records.push(newRecord);
    saveData();
    renderTables();
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
}

function deleteRecord(id) {
    records = records.filter(record => record.id !== id);
    saveData();
    renderTables();
}

function saveData() {
    localStorage.setItem('energyRecords', JSON.stringify(records));
}

function handleFilterChange() {
    customDates.style.display = periodSelect.value === 'custom' ? 'block' : 'none';
    renderTables();
}

function getFilterBoundaries() {
    const period = periodSelect.value;
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let startDate = new Date(0); // Rok 1970
    let endDate = new Date('2100-01-01');

    if (period === 'week') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
    } else if (period === 'month') {
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
    } else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
    } else if (period === 'custom') {
        if (dateFrom.value) {
            startDate = new Date(dateFrom.value);
            startDate.setHours(0, 0, 0, 0);
        }
        if (dateTo.value) {
            endDate = new Date(dateTo.value);
            endDate.setHours(23, 59, 59, 999);
        }
    }
    return { startDate, endDate };
}

function renderTables() {
    const { startDate, endDate } = getFilterBoundaries();
    
    const categoriesInfo = [
        { id: 'voda', unit: 'm³' },
        { id: 'plyn', unit: 'm³' },
        { id: 'elektrina', unit: 'kWh' }
    ];

    categoriesInfo.forEach(cat => {
        const tbody = document.querySelector(`#table-${cat.id} tbody`);
        const totalSpan = document.getElementById(`${cat.id}-total`);
        tbody.innerHTML = '';

        // 1. Získáme všechny záznamy kategorie a seřadíme je od nejstaršího
        const allCatRecords = records
            .filter(r => r.category === cat.id)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // 2. Vypočítáme spotřebu pro každý záznam OPROTI PŘEDCHOZÍMU
        const processedRecords = allCatRecords.map((record, index) => {
            let consumption = 0;
            if (index > 0) {
                consumption = record.value - allCatRecords[index - 1].value;
            }
            return { ...record, consumption };
        });

        // 3. Až teď aplikujeme filtr období
        const filteredRecords = processedRecords.filter(record => {
            const rDate = new Date(record.date);
            rDate.setHours(12, 0, 0, 0); // Bezpečné ignorování časových zón
            return rDate >= startDate && rDate <= endDate;
        });

        let periodTotal = 0;

        if (filteredRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">ŽÁDNÁ DATA V TOMTO OBDOBÍ</td></tr>';
            totalSpan.textContent = `0 ${cat.unit}`;
            return;
        }

        // 4. Vykreslíme data
        filteredRecords.forEach((record) => {
            // Sečtení celkové spotřeby ZA OBDOBÍ 
            periodTotal += record.consumption;

            const tr = document.createElement('tr');
            const dateObj = new Date(record.date);
            const formattedDate = dateObj.toLocaleDateString('cs-CZ');
            
            // Pokud je to první záznam celkově (historicky), napíšeme pomlčku
            const isFirstEver = allCatRecords.indexOf(allCatRecords.find(r => r.id === record.id)) === 0;
            const displayConsumption = isFirstEver ? '-' : `+ ${record.consumption.toFixed(2)}`;

            tr.innerHTML = `
                <td data-label="Datum">${formattedDate}</td>
                <td data-label="Stav">${record.value.toFixed(2)}</td>
                <td data-label="Spotřeba"><strong>${displayConsumption}</strong></td>
                <td data-label="Akce"><button class="delete-btn" onclick="deleteRecord('${record.id}')">X SMAZAT</button></td>
            `;
            tbody.appendChild(tr);
        });

        // Nastavíme nápis s celkovou spotřebou v daném filtru
        totalSpan.textContent = `${periodTotal.toFixed(2)} ${cat.unit}`;
    });
}

// Spuštění při startu
renderTables();
