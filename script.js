'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #workouts = [];
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  constructor() {
    this._getPosition();

    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToMarker.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
      console.log('Error.')
    );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords).addTo(this.#map).bindPopup('I live here').openPopup();

    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(workout => {
      this.displayMarkerOnMap(workout);
    });
  }

  _showForm(event) {
    this.#mapEvent = event;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const type = inputType.value;
    const cadence = Number(inputCadence.value);
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const elevation = +inputElevation.value;
    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    if (
      // input validation
      (!cadence > 0 && !distance > 0 && !duration > 0) ||
      (!isFinite(elevation) && !distance > 0 && !duration > 0)
    ) {
      return alert('Inputs must be positive numbers.');
    }

    // display marker on map
    if (type == 'running') {
      workout = new Running([lat, lng], distance, duration, cadence);
      this.displayMarkerOnMap(workout);
      this.renderWorkout(workout);
    } else if (type == 'cycling') {
      workout = new Cycling([lat, lng], distance, duration, elevation);
      this.displayMarkerOnMap(workout);

      this.renderWorkout(workout);
    }

    // Clear inputs
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    form.classList.add('hidden');
    this.#workouts.push(workout);

    this._setLocalStorage();
  }

  displayMarkerOnMap(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type} on ${this.formatDate(workout.date)}`)
      .openPopup();
  }

  formatDate(date) {
    const day = date.getDate(); // Get the day of the month (1-31)
    const month = date.toLocaleString('default', { month: 'long' }); // Get the full month name
    return `${day} ${month}`;
  }

  renderWorkout(workout) {
    const displayWorkouts = document.querySelector('.workouts');
    const li = document.createElement('li');
    const formattedDate = this.formatDate(workout.date);
    li.className = `workout workout--${workout.type}`; // Add the class
    li.setAttribute('data-id', workout.id); // Add the data-id attribute
    li.innerHTML = `
  <h2 class="workout__title">${workout.type} on ${formattedDate}</h2>
  <div class="workout__details">
    <span class="workout__icon">${
      workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
    }</span>
    <span class="workout__value">${workout.distance}</span>
    <span class="workout__unit">km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⏱</span>
    <span class="workout__value">${workout.duration}</span>
    <span class="workout__unit">min</span>
  </div>
  
  
`;

    if (workout.type === 'running') {
      li.innerHTML += `
    <div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.pace.toFixed(1)}</span>
    <span class="workout__unit">min/km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">🦶🏼</span>
    <span class="workout__value">${workout.cadence}</span>
    <span class="workout__unit">spm</span>
  </div> 
    `;
    }

    if (workout.type === 'cycling') {
      li.innerHTML += `
    <div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.speed.toFixed(1)}</span>
    <span class="workout__unit">min/km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⛰</span>
    <span class="workout__value">${workout.elevationGain}</span>
    <span class="workout__unit">spm</span>
  </div>
    `;
    }

    displayWorkouts.appendChild(li);
  }

  _moveToMarker(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data.map(workout => {
      if (workout.type === 'running') {
        return Object.assign(
          new Running(
            workout.coords,
            workout.distance,
            workout.duration,
            workout.cadence
          ),
          { date: new Date(workout.date) }
        );
      } else if (workout.type === 'cycling') {
        return Object.assign(
          new Cycling(
            workout.coords,
            workout.distance,
            workout.duration,
            workout.elevationGain
          ),
          { date: new Date(workout.date) }
        );
      }
    });

    this.#workouts.forEach(workout => {
      this.renderWorkout(workout);
    });
  }

  // reset the app
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
