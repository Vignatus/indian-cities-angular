import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { CityModel } from '../models/cities.model';

@Injectable({
  providedIn: 'root'
})
export class APIService {

    private baseUrl = "https://indian-cities-api-nocbegfhqg.now.sh/";

    constructor(private http: HttpClient) { }

    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json'
        })
    }

    getCities(parameter?: HttpParams): Observable<CityModel[]> {
        parameter = parameter || new HttpParams();
        return this.http.get<CityModel[]>(this.baseUrl + 'cities/', {
            params: parameter
        })
        .pipe(
            retry(1),
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
