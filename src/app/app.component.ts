import { Component, OnInit } from '@angular/core';
import { APIService } from './services/api.service';
import { CityModel } from './models/cities.model';
import * as _ from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
//   title = 'india-cities-angular';
private cityPromise: Promise<CityModel[]>;
// cities: CityModel[];
stateCityMapping: {
    [key: string]: CityModel[];
};
states: string[];
stateSelected: string;

constructor(
    public apiService: APIService
) {
    this.stateCityMapping = {};
    // this.stateSelected = "Select a state";
}

ngOnInit() {
    this.cityPromise = this.apiService.getCities().toPromise();
    this.initialSetup();
}

async initialSetup() {
    let cities = await this.cityPromise;
    // console.log(this.cities);
    let unionTerritory = /\*$/;
    for(let city of cities) {
        if (unionTerritory.test(city.State)) {
            city.State = city.State.slice(0,city.State.length-2);
        }
        this.stateCityMapping[city.State] = this.stateCityMapping[city.State] || [];
        this.stateCityMapping[city.State].push(city);
    }
    this.states = Object.keys(this.stateCityMapping).sort();
    cities.length = 0;
}

}
