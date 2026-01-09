package com.hrm.utility.repository;

import com.hrm.utility.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Integer> {

    // SỬA LẠI: Dùng @Query để chỉ định chính xác câu lệnh lấy dữ liệu
    // JPQL uses the entity class name (LeaveRequest) and Java property names
    // (managerID, status).
    @Query("SELECT l FROM LeaveRequest l WHERE l.managerID = :managerId AND l.status = :status")
    List<LeaveRequest> findByManagerIDAndStatus(@Param("managerId") Integer managerId, @Param("status") String status);

    // Fetch all requests by manager ID (for all statuses)
    @Query("SELECT l FROM LeaveRequest l WHERE l.managerID = :managerId")
    List<LeaveRequest> findByManagerID(@Param("managerId") Integer managerId);

    // 3. (QUAN TRỌNG) Lấy theo Manager + Status + LeaveTypeID
    // Hàm này giúp lọc danh sách "Pending" theo loại nghỉ
    @Query("SELECT l FROM LeaveRequest l WHERE l.managerID = :managerId AND l.status = :status AND l.leaveType.leaveTypeID = :leaveTypeId")
    List<LeaveRequest> findByManagerIDAndStatusAndLeaveType(@Param("managerId") Integer managerId, 
                                                            @Param("status") String status, 
                                                            @Param("leaveTypeId") Integer leaveTypeId);

    // 4. (QUAN TRỌNG) Lấy theo Manager + LeaveTypeID
    // Hàm này giúp lọc danh sách lịch sử "All" theo loại nghỉ
    @Query("SELECT l FROM LeaveRequest l WHERE l.managerID = :managerId AND l.leaveType.leaveTypeID = :leaveTypeId")
    List<LeaveRequest> findByManagerIDAndLeaveType(@Param("managerId") Integer managerId, 
                                                   @Param("leaveTypeId") Integer leaveTypeId);
}