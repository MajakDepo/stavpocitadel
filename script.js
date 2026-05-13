let records = JSON.parse(localStorage.getItem('sysEnergoRecords')) || [];

// Nastavení data
document.getElementById('date').valueAsDate = new Date();

const form = document.getElementById('recordForm');
const periodSelect = document.getElementById('period');
const customDates = document.getElementById('custom-dates');
const dateFrom = document.getElementById('date-from');
const dateTo = document.getElementById('date-to');

form.addEventListener('submit', addRecord);
periodSelect.addEventListener('change', handleFilterChange);
dateFrom.addEventListener('change', renderLists);
dateTo.addEventListener('change', renderLists);

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
    renderLists();
    
    // Reset inputs, ale zachování kategorie a nastavení dnešního data
    document.getElementById('value').value = '';
    document.getElementById('date').valueAsDate = new Date();
}

function deleteRecord(id) {
    records = records.filter(record => record.id !== id);
    saveData();
    renderLists();
}

function saveData() {
    localStorage.setItem('sysEnergoRecords', JSON.stringify(records));
}

function handleFilterChange() {
    if (periodSelect.value === 'custom') {
        customDates.classList.remove('custom-dates-hidden');
    } else {
        customDates.classList.add('custom-dates-hidden');
    }
    renderLists();
}

function getFilteredRecords() {
    const period = periodSelect.value;
    const now = new Date();
    let startDate = new Date(0);
    let endDate = new Date('2100-01-01');

    if (period === 'week') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0 <= endDate;
    });
}

function renderLists() {
    const filteredRecords = getFilteredRecords();
    const categories = ['Voda', 'Plyn', 'Elektřina'];

    categories.forEach(category => {
        const container = document.getElementById(`list-${category}`);
        container.innerHTML = '';

        const catRecords = filteredRecords
            .filter(r => r.category === category)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (catRecords.length === 0) {
            container.innerHTML = '<div class="empty-state">ŽÁDNÁ DATA</div>';
            return;
        }

        const firstValue = catRecords[0].value;

        // Procházení odzadu, abychom viděli nejnovější záznamy nahoře
        catRecords.slice().reverse().forEach(record => {
            // Najdeme původní index pro výpočet rozdílu
            const originalIndex = catRecords.findIndex(r => r.id === record.id);
            
            const dateObj = new Date(record.date);
            // Formát data DD.MM.YYYY
            const formattedDate = dateObj.toLocaleDateString('cs-CZ', {day: '2-digit', month: '2-digit', year: 'numeric'});
            
            let consumptionHtml = '';
            let isFirst = originalIndex === 0;

            if (!isFirst) {
                const consumption = (record.value - firstValue).toFixed(2);
                consumptionHtml = `<div class="record-consumption">+ ${consumption} od počátku</div>`;
            } else {
                consumptionHtml = `<div class="record-consumption" style="color: var(--text-muted)">Výchozí hodnota</div>`;
            }

            const card = document.createElement('div');
            card.className = `record-card ${isFirst ? 'first-record' : ''}`;
            
            card.innerHTML = `
                <div class="record-details">
                    <div class="record-date">${formattedDate}</div>
                    <div class="record-value">${record.value}</div>
                    ${consumptionHtml}
                </div>
                <div class="record-actions">
                    <button class="btn-delete" onclick="deleteRecord('${record.id}')">X</button>
                </div>
            `;
            container.appendChild(card);
        });
    });
}

// První vykreslení
renderLists();
