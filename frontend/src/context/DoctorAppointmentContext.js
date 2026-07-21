import React, { createContext, useContext, useState } from 'react';

const DoctorAppointmentContext = createContext({ refreshCount: 0 });

export const DoctorAppointmentProvider = ({ children }) => {
  const [refreshCount, setRefreshCount] = useState(0);
  return (
    <DoctorAppointmentContext.Provider value={{ refreshCount, setRefreshCount }}>
      {children}
    </DoctorAppointmentContext.Provider>
  );
};

export const useDoctorAppointments = () => useContext(DoctorAppointmentContext);
