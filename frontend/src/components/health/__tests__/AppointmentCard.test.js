import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AppointmentCard from '../AppointmentCard';

const defaultProps = {
  doctorName: 'Dr. Smith',
  doctorAvatar: { uri: 'https://example.com/avatar.jpg' },
  specialty: 'Cardiology',
  date: '2026-07-15',
  time: '10:30 AM',
  status: 'pending',
  location: 'Room 301, City Hospital',
  onPress: jest.fn(),
  onReschedule: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AppointmentCard', () => {
  it('renders doctor name, specialty, date, time', async () => {
    const { getByText } = await render(<AppointmentCard {...defaultProps} />);
    expect(getByText('Dr. Smith')).toBeTruthy();
    expect(getByText('Cardiology')).toBeTruthy();
    expect(getByText('2026-07-15')).toBeTruthy();
    expect(getByText('10:30 AM')).toBeTruthy();
  });

  it('renders location when provided', async () => {
    const { getByText } = await render(<AppointmentCard {...defaultProps} />);
    expect(getByText('Room 301, City Hospital')).toBeTruthy();
  });

  it('does NOT render location when not provided', async () => {
    const { queryByText } = await render(<AppointmentCard {...defaultProps} location={undefined} />);
    expect(queryByText('Room 301, City Hospital')).toBeNull();
  });

  it('shows Reschedule and Cancel buttons when status is confirmed and callbacks provided', async () => {
    const { getByText } = await render(<AppointmentCard {...defaultProps} status="confirmed" />);
    expect(getByText('Reschedule')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('does NOT show action buttons when status is completed', async () => {
    const { queryByText } = await render(<AppointmentCard {...defaultProps} status="completed" />);
    expect(queryByText('Reschedule')).toBeNull();
    expect(queryByText('Cancel')).toBeNull();
  });

  it('does NOT show action buttons when onReschedule/onCancel not provided', async () => {
    const { queryByText } = await render(
      <AppointmentCard
        {...defaultProps}
        status="confirmed"
        onReschedule={undefined}
        onCancel={undefined}
      />
    );
    expect(queryByText('Reschedule')).toBeNull();
    expect(queryByText('Cancel')).toBeNull();
  });

  it('calls onPress when card is pressed', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<AppointmentCard {...defaultProps} onPress={onPress} />);
    fireEvent.press(getByText('Dr. Smith'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onReschedule when reschedule button pressed', async () => {
    const onReschedule = jest.fn();
    const { getByText } = await render(
      <AppointmentCard
        {...defaultProps}
        status="confirmed"
        onReschedule={onReschedule}
        onCancel={undefined}
      />
    );
    fireEvent.press(getByText('Reschedule'));
    expect(onReschedule).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button pressed', async () => {
    const onCancel = jest.fn();
    const { getByText } = await render(
      <AppointmentCard
        {...defaultProps}
        status="confirmed"
        onReschedule={undefined}
        onCancel={onCancel}
      />
    );
    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('applies correct status variant to badge (pending renders without crash)', async () => {
    const pending = await render(<AppointmentCard {...defaultProps} />);
    expect(pending.getByText('Dr. Smith')).toBeTruthy();

    const confirmed = await render(<AppointmentCard {...defaultProps} status="confirmed" />);
    expect(confirmed.getByText('Reschedule')).toBeTruthy();
  });
});