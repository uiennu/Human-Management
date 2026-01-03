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
    @Query("SELECT l FROM LeaveRequest l WHERE l.managerID = :managerId AND l.status = :status")
    List<LeaveRequest> findByManagerIDAndStatus(@Param("managerId") Integer managerId, @Param("status") String status);
}