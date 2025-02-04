import {QuoteGetRequest} from '@jup-ag/api';

export interface NextTradeDTO extends QuoteGetRequest {
    nextTradeThreshold: number;
    lastTokenTradeValue: number;
    lastSolTradeValue:number;
}