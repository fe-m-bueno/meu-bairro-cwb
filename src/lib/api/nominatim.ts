export interface NominatimResult {
  displayName: string
  lat: number
  lng: number
}

export async function searchAddress(
  _query: string,
): Promise<NominatimResult[]> {
  return []
}
