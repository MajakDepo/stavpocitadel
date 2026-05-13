// Inicializace dat z localStorage nebo vytvoření prázdného pole
let records = JSON.parse(localStorage.getItem('energyRecords')) || [];

// Nastavení dnešního data jako výchozího při načtení
document.getElementById('date').valueAsDate = new Date();

// DOM elementy
const form = document.getElementById('recordForm');
const periodSelect = document.getElementById('period');
const customDates = document.getElementById('custom-dates');
const dateFrom = document.getElementById('date-from');
const dateTo = document.getElementById('date-to');

// Event listenery
form.addEventListener('submit', addRecord);
periodSelect.addEventListener('change', handleFilterChange);
dateFrom.addEventListener('change', renderTables);
dateTo.addEventListener('change', renderTables);

function addRecord(e) {
    e.preventDefault();
    
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const value = parseFloat(document.getElementById('value').value);

    const newRecord = {
        id: Date.now().toString(),
        category,
        date,
        value
    };

    records.push(newRecord);
    saveData();
    renderTables();
    form.reset();
    document.getElementById('date').valueAsDate = new Date(); // Reset data
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
    if (periodSelect.value === 'custom') {
        customDates.style.display = 'inline-block';
    } else {
        customDates.style.display = 'none';
    }
    renderTables();
}

function getFilteredRecords() {
    const period = periodSelect.value;
    const now = new Date();
    let startDate = new Date(0); // Výchozí - počátek věků
    let endDate = new Date('2100-01-01');

    if (period === 'week') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'custom') {
        if (dateFrom.value) startDate = new Date(dateFrom.value);
        if (dateTo.value) endDate = new Date(dateTo.value);
        endDate.setHours(23, 59, 59); // Konec vybraného dne
    }

    return records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
    });
}

function renderTables() {
    const filteredRecords = getFilteredRecords();
    const categories = ['Voda', 'Plyn', 'Elektřina'];

    categories.forEach(category => {
        const tbody = document.querySelector(`#table-${category} tbody`);
        tbody.innerHTML = ''; // Vyčištění tabulky

        // Vyfiltrování pouze dané kategorie a seřazení podle data od nejstaršího
        const catRecords = filteredRecords
            .filter(r => r.category === category)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (catRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Žádné záznamy v tomto období</td></tr>';
            return;
        }

        const firstValue = catRecords[0].value; // Hodnota prvního záznamu (pro výpočet spotřeby)

        catRecords.forEach((record, index) => {
            const tr = document.createElement('tr');
            
            // Formátování data do českého tvaru
            const dateObj = new Date(record.date);
            const formattedDate = dateObj.toLocaleDateString('cs-CZ');
            
            // Výpočet spotřeby: od druhého záznamu počítáme rozdíl od toho úplně prvního
            let consumption = '-';
            if (index > 0) {
                consumption = (record.value - firstValue).toFixed(2);
            }

            tr.innerHTML = `
                <td>${formattedDate}</td>
                <td>${record.value}</td>
                <td><strong>${consumption}</strong></td>
                <td><button class="delete-btn" onclick="deleteRecord('${record.id}')">Smazat</button></td>
            `;
            tbody.appendChild(tr);
        });
    });
}

// První vykreslení po načtení stránky
renderTables();
