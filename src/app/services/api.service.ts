import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import { CityModel } from '../models/cities.model';


declare interface GeoCoderResponse {
    results: google.maps.GeocoderResult[];
    status: google.maps.GeocoderStatus
}
@Injectable({
  providedIn: 'root'
})
export class APIService {

    private baseUrl = "https://indian-cities-api-nocbegfhqg.now.sh/";
    private geoCodeUrl = "https://maps.googleapis.com/maps/api/geocode/json";

    constructor(private http: HttpClient) { }

    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json'
        })
    }

    getCities(parameter?: any): Observable<CityModel[]> {
        parameter = parameter || {};
        return this.http.get<CityModel[]>(this.baseUrl + 'cities/', {
            params: parameter
        })
        .pipe(
            retry(1),
            catchError(this.errorHandl)
        )
    }

    geoCode(parameter: any): Observable<google.maps.GeocoderGeometry> {
        return this.http.get<any>(this.geoCodeUrl, {
            params: parameter
        })
        .pipe(
            map(response => {
                if (response.results.length) {
                    let result = response.results[0].geometry;
                    let bounds: google.maps.LatLngBounds;
                    if (result.bounds) {
                        bounds = new google.maps.LatLngBounds(result.bounds.southwest, result.bounds.northeast);
                    } else bounds = new google.maps.LatLngBounds();
                    let viewport: google.maps.LatLngBounds;
                    if (result.viewport) {
                        viewport = new google.maps.LatLngBounds(result.viewport.southwest, result.viewport.northeast);
                    } else viewport = new google.maps.LatLngBounds();
                    let location: google.maps.LatLng = new google.maps.LatLng(result.location);
                    let geometry: google.maps.GeocoderGeometry = {
                        bounds: bounds,
                        viewport: viewport,
                        location: location,
                        location_type: result.location_type
                    }
                    return geometry;
                }
                return null;
            }),
            catchError(this.errorHandl)
        )
    }

    private errorHandl(error) {
        let errorMessage = '';
        if(error.error instanceof ErrorEvent) {
          // Get client-side error
          errorMessage = error.error.message;
        } else {
          // Get server-side error
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        console.log(errorMessage);
        return throwError(errorMessage);
    }
}
