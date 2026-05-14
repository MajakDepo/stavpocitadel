let records = JSON.parse(localStorage.getItem('energyRecords')) || [];

// Automatická oprava starších dat (pro jistotu z předchozích verzí)
records = records.map(record => {
    if (record.category === 'Voda') record.category = 'voda';
    if (record.category === 'Plyn') record.category = 'plyn';
    if (record.category === 'Elektřina') record.category = 'elektrina';
    return record;
});
localStorage.setItem('energyRecords', JSON.stringify(records));

document.getElementById('date').valueAsDate = new Date();

const form = document.getElementById('recordForm');
const periodSelect = document.getElementById('period');
const customDates = document.getElementById('custom-dates');
const dateFrom = document.getElementById('date-from');
const dateTo = document.getElementById('date-to');

// --- EVENT LISTENERY ---
form.addEventListener('submit', addRecord);
periodSelect.addEventListener('change', handleFilterChange);
dateFrom.addEventListener('change', renderTables);
dateTo.addEventListener('change', renderTables);

// --- ZÁLOHA A OBNOVA (Nové funkce) ---
document.getElementById('btn-export').addEventListener('click', () => {
    if(records.length === 0) {
        alert("Nejsou žádná data k uložení.");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    
    // Vytvoření názvu souboru s dnešním datem
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchorNode.setAttribute("download", `energie_zaloha_${dateStr}.json`);
    
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});

document.getElementById('file-import').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            if (Array.isArray(importedData)) {
                records = importedData; // Přepíše aktuální data těmi ze zálohy
                saveData();
                renderTables();
                alert("Data byla úspěšně nahrána a obnovena!");
            } else {
                alert("Soubor nemá správný formát.");
            }
        } catch (err) {
            alert("Došlo k chybě při čtení souboru.");
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset inputu
});
// ------------------------------------

function addRecord(e) {
    e.preventDefault();
    
    const category = document.getElementById('category').value;
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
    if(confirm("Opravdu chcete tento záznam smazat?")) {
        records = records.filter(record => record.id !== id);
        saveData();
        renderTables();
    }
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

    let startDate = new Date(0);
    let endDate = new Date('2100-01-01');

    if (period === 'week') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
    } else if (period === 'month') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 30); // Opraveno přesně na 30 dní
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
        const tableElement = document.querySelector(`#table-${cat.id} tbody`);
        const totalSpan = document.getElementById(`${cat.id}-total`);
        
        if (!tableElement || !totalSpan) return;
        
        tableElement.innerHTML = '';

        // Seřazení chronologicky
        const allCatRecords = records
            .filter(r => r.category === cat.id)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Výpočet spotřeby OPROTI PŘEDCHOZÍMU záznamu (bez ohledu na filtr)
        const processedRecords = allCatRecords.map((record, index) => {
            let consumption = 0;
            if (index > 0) {
                consumption = record.value - allCatRecords[index - 1].value;
            }
            return { ...record, consumption };
        });

        // Aplikace filtru období
        const filteredRecords = processedRecords.filter(record => {
            const rDate = new Date(record.date);
            rDate.setHours(12, 0, 0, 0);
            return rDate >= startDate && rDate <= endDate;
        });

        let periodTotal = 0;

        if (filteredRecords.length === 0) {
            tableElement.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">ŽÁDNÁ DATA V TOMTO OBDOBÍ</td></tr>';
            totalSpan.textContent = `0 ${cat.unit}`;
            return;
        }

        filteredRecords.forEach((record) => {
            // SCÍTÁNÍ POUZE VYFILTROVANÝCH ZÁZNAMŮ
            periodTotal += record.consumption;

            const tr = document.createElement('tr');
            const dateObj = new Date(record.date);
            const formattedDate = dateObj.toLocaleDateString('cs-CZ');
            
            const isFirstEver = allCatRecords.indexOf(allCatRecords.find(r => r.id === record.id)) === 0;
            const displayConsumption = isFirstEver ? '-' : `+ ${record.consumption.toFixed(2)}`;

            tr.innerHTML = `
                <td data-label="Datum">${formattedDate}</td>
                <td data-label="Stav">${record.value.toFixed(2)}</td>
                <td data-label="Spotřeba"><strong>${displayConsumption}</strong></td>
                <td data-label="Akce"><button class="delete-btn" onclick="deleteRecord('${record.id}')">X SMAZAT</button></td>
            `;
            tableElement.appendChild(tr);
        });

        // Vypsání výsledku do HTML panelu
        totalSpan.textContent = `${periodTotal.toFixed(2)} ${cat.unit}`;
    });
}

renderTables();
