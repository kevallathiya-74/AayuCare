import React, { createContext, useContext, useState } from "react";

const AdminAppointmentContext = createContext({ refreshCount: 0 });

export const AdminAppointmentProvider = ({ children }) => {
  const [refreshCount, setRefreshCount] = useState(0);
  return (
    <AdminAppointmentContext.Provider value={{ refreshCount, setRefreshCount }}>
      {children}
    </AdminAppointmentContext.Provider>
  );
};

export const useAdminAppointments = () => useContext(AdminAppointmentContext);
