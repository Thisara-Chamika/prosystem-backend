import { AdminRepository } from "./admin.repository";

const adminRepository = new AdminRepository();

export class AdminService {
  async getMetrics() {
    return await adminRepository.getMetrics();
  }
}