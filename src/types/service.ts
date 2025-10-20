// This represents the data stored in the /services/{serviceId} document
export interface Service {
  id: string; // The document ID
  name: string;
  price: number;
  duration: number; // Duration in minutes
  category: string;
  description: string;
  available: boolean;
}