document.addEventListener('DOMContentLoaded', () => {
    const calculationNameInput = document.getElementById('calculationNameInput');
    const distanceInput = document.getElementById('distanceInput');
    const desiredTimeHoursInput = document.getElementById('desiredTimeHoursInput');
    const desiredTimeMinutesInput = document.getElementById('desiredTimeMinutesInput');
    const stopsInput = document.getElementById('stopsInput');
    const stopTimesContainer = document.getElementById('stopTimesContainer');
    const calculateButton = document.getElementById('calculateButton');
    const clearHistoryButton = document.getElementById('clearHistoryButton');
    const exportButton = document.getElementById('exportButton');
    const resultDiv = document.getElementById('result');
    const historyList = document.getElementById('historyList');
    let calculationsHistory = [];

    if (localStorage.getItem('calculationsHistory')) {
        calculationsHistory = JSON.parse(localStorage.getItem('calculationsHistory'));
        updateHistoryList();
    }

    stopsInput.addEventListener('change', () => {
        const numberOfStops = parseInt(stopsInput.value);
        stopTimesContainer.innerHTML = '';
        for (let i = 0; i < numberOfStops; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.placeholder = `Tid för stopp ${i + 1} (minuter)`;
            input.className = 'stopTimeInput';
            stopTimesContainer.appendChild(input);
        }
    });

    calculateButton.addEventListener('click', () => {
        const calculationName = calculationNameInput.value.trim();
        const distance = parseFloat(distanceInput.value);
        const desiredTimeHours = parseFloat(desiredTimeHoursInput.value);
        const desiredTimeMinutes = parseFloat(desiredTimeMinutesInput.value);
        const stops = parseInt(stopsInput.value);

        if (!calculationName) {
            alert('Du måste ange ett namn för din uträkning.');
            return;
        }
        if (calculationsHistory.some(calc => calc.name === calculationName)) {
            alert('En uträkning med detta namn finns redan. Ange ett annat namn.');
            return;
        }
        if (isNaN(distance) || distance <= 0) {
            alert('Ange en giltig distans.');
            return;
        }
        if (isNaN(desiredTimeHours) || desiredTimeHours < 0) {
            alert('Ange en giltig önskad sluttid i timmar.');
            return;
        }
        if (isNaN(desiredTimeMinutes) || desiredTimeMinutes < 0 || desiredTimeMinutes >= 60) {
            alert('Ange en giltig önskad sluttid i minuter (0-59).');
            return;
        }
        if (isNaN(stops) || stops < 0) {
            alert('Ange ett giltigt antal stopp.');
            return;
        }

        const stopTimeInputs = document.getElementsByClassName('stopTimeInput');
        let totalStopTime = 0;
        Array.from(stopTimeInputs).forEach(input => {
            totalStopTime += parseInt(input.value) || 0;
        });

        const desiredTimeTotalMinutes = (desiredTimeHours * 60) + desiredTimeMinutes;
        const cyclingTime = desiredTimeTotalMinutes - totalStopTime;
        const speedWithStops = cyclingTime > 0 ? (distance / (cyclingTime / 60)).toFixed(1) : 0;
        const speedWithoutStops = desiredTimeTotalMinutes > 0 ? (distance / (desiredTimeTotalMinutes / 60)).toFixed(1) : 0;

        let resultText = '';
        if (cyclingTime <= 0) {
            resultText = 'Önskad tid är för kort för antal stopp och stopptid.';
        } else {
            resultText = `För att uppnå önskad sluttid med stopp bör din genomsnittshastighet vara <strong>${speedWithStops} km/h</strong>. `;
            resultText += `Utan stopp skulle krävd hastighet vara <strong>${speedWithoutStops} km/h</strong>.`;
        }
        resultDiv.innerHTML = resultText;

        calculationsHistory.unshift({
            name: calculationName,
            distance: distanceInput.value,
            desiredTime: `${desiredTimeHoursInput.value}h ${desiredTimeMinutesInput.value}m`,
            stops: Array.from(stopTimeInputs).map(input => input.value),
            totalStopsTime: totalStopTime,
            speedWithStops: speedWithStops,
            speedWithoutStops: speedWithoutStops
        });

        updateHistoryList();
        localStorage.setItem('calculationsHistory', JSON.stringify(calculationsHistory));

        resetForm(); // Nollställer formuläret efter varje beräkning
    });

    clearHistoryButton.addEventListener('click', () => {
        const isConfirmed = confirm('Är du säker på att du vill rensa historiken?');
        if (isConfirmed) {
            calculationsHistory = [];
            localStorage.removeItem('calculationsHistory');
            updateHistoryList();
            resetForm();
        }
    });

    exportButton.addEventListener('click', () => {
        if (calculationsHistory.length === 0) {
            alert('Det finns inga uträkningar att exportera.');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Namn,Distans,Önskad Tid,Stopp,Hastighet med Stopp,Hastighet utan Stopp\n";
        calculationsHistory.forEach(calculation => {
            const row = [
                calculation.name,
                calculation.distance,
                calculation.desiredTime,
                calculation.stops.join('; '),
                calculation.speedWithStops,
                calculation.speedWithoutStops
            ].join(',');
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "calculations_history.csv");
        document.body.appendChild(link);

        link.click();
        document.body.removeChild(link);
    });

    function updateHistoryList() {
        historyList.innerHTML = '';
        calculationsHistory.forEach(calculation => {
            const li = document.createElement('li');
    
            const calculationName = document.createElement('div');
            calculationName.textContent = calculation.name;
            calculationName.style.fontWeight = 'bold';
            li.appendChild(calculationName);
    
            const distance = document.createElement('div');
            distance.textContent = `Distans: ${calculation.distance} km`;
            li.appendChild(distance);
    
            const desiredTime = document.createElement('div');
            desiredTime.textContent = `Önskad tid: ${calculation.desiredTime}`;
            li.appendChild(desiredTime);
    
            if (calculation.stops && calculation.stops.length > 0) {
                const stopsInfo = document.createElement('div');
                const totalStopsTime = calculation.stops.reduce((total, stopTime) => total + parseInt(stopTime), 0);
                stopsInfo.textContent = `Stopp: ${calculation.stops.join(', ')} (Totalt: ${totalStopsTime}min)`;
                li.appendChild(stopsInfo);
            }
    
            const averageSpeedWithStops = document.createElement('div');
            averageSpeedWithStops.textContent = `Snitthastighet med stopp: ${calculation.speedWithStops} km/h`;
            li.appendChild(averageSpeedWithStops);
    
            const averageSpeedWithoutStops = document.createElement('div');
            averageSpeedWithoutStops.textContent = `Snitthastighet utan stopp: ${calculation.speedWithoutStops} km/h`;
            li.appendChild(averageSpeedWithoutStops);
    
            historyList.appendChild(li);
        });
    }

    function resetForm() {
        calculationNameInput.value = '';
        distanceInput.value = '';
        desiredTimeHoursInput.value = '';
        desiredTimeMinutesInput.value = '';
        stopsInput.value = '';
        stopTimesContainer.innerHTML = '';
        resultDiv.innerHTML = '';
    }
});
