import {QuoteGetRequest} from '@jup-ag/api';

export interface NextTradeDTO extends QuoteGetRequest {
    lastTokenTradeValue: number;
    lastSolTradeValue:number;
}