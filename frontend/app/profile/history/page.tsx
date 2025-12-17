'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History, User, Calendar, FileText, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5204';

interface EmployeeEvent {
  eventName: string;
  data: string; // JSON string
  time: string;
  version: number;
}

export default function ProfileHistoryPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EmployeeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  // State for toggling sensitive fields (key: event index + field)
  const [showSensitive, setShowSensitive] = useState<{[k:string]: boolean}>({});
  const toggleSensitive = (key: string) => setShowSensitive(s => ({...s, [key]: !s[key]}));

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Get current employee info first
      const profileResponse = await fetch(`${API_BASE_URL}/api/employees/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) throw new Error('Failed to fetch profile');
      
      const profile = await profileResponse.json();
      setEmployeeId(profile.employeeId);

      // Get history
      const historyResponse = await fetch(
        `${API_BASE_URL}/api/employees/me/${profile.employeeId}/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!historyResponse.ok) throw new Error('Failed to fetch history');

      const data = await historyResponse.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseEventData = (dataString: string) => {
    try {
      return JSON.parse(dataString);
    } catch {
      return {};
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('Created') || eventType.includes('Imported')) {
      return <User className="h-5 w-5 text-green-600" />;
    }
    if (eventType.includes('Updated') || eventType.includes('Modified')) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    return <History className="h-5 w-5 text-gray-600" />;
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('Created') || eventType.includes('Imported')) {
      return 'bg-green-100 text-green-800';
    }
    if (eventType.includes('Updated') || eventType.includes('Modified')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const renderEventData = (eventType: string, data: any, eventIndex?: number) => {
    // For ProfileUpdated event
    if (eventType === 'ProfileUpdated') {
      // UpdatedAt có thể là object hoặc string
      let updatedAtValue = '';
      if (data.UpdatedAt) {
        if (typeof data.UpdatedAt === 'object' && data.UpdatedAt.New) {
          updatedAtValue = data.UpdatedAt.New;
        } else if (typeof data.UpdatedAt === 'string') {
          updatedAtValue = data.UpdatedAt;
        }
      }
      return (
        <div className="mt-2 space-y-2 text-sm">
          {data.Phone && (
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-600 min-w-[120px]">Phone:</span>
              <div>
                {data.Phone.Old && <span className="line-through text-red-600">{data.Phone.Old}</span>}
                {data.Phone.Old && data.Phone.New && <span className="mx-2">→</span>}
                {data.Phone.New && <span className="text-green-600">{data.Phone.New}</span>}
              </div>
            </div>
          )}
          {data.Address && (
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-600 min-w-[120px]">Address:</span>
              <div>
                {data.Address.Old && <span className="line-through text-red-600">{data.Address.Old}</span>}
                {data.Address.Old && data.Address.New && <span className="mx-2">→</span>}
                {data.Address.New && <span className="text-green-600">{data.Address.New}</span>}
              </div>
            </div>
          )}
          {data.PersonalEmail && (
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-600 min-w-[120px]">Personal Email:</span>
              <div>
                {data.PersonalEmail.Old && <span className="line-through text-red-600">{data.PersonalEmail.Old}</span>}
                {data.PersonalEmail.Old && data.PersonalEmail.New && <span className="mx-2">→</span>}
                {data.PersonalEmail.New && <span className="text-green-600">{data.PersonalEmail.New}</span>}
              </div>
            </div>
          )}
          {updatedAtValue && (
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-600 min-w-[120px]">Updated At:</span>
              <span>{formatDate(updatedAtValue)}</span>
            </div>
          )}
        </div>
      );
    }

    // For EmergencyContactsUpdated event
    if (eventType === 'EmergencyContactsUpdated') {
      const oldContacts = data.Old || [];
      const newContacts = data.New || [];
      
      return (
        <div className="mt-2 space-y-3 text-sm">
          {oldContacts.length > 0 && (
            <div>
              <span className="font-medium text-gray-600 block mb-2">Previous Contacts:</span>
              <div className="space-y-1 pl-4">
                {oldContacts.map((contact: any, index: number) => (
                  <div key={index} className="text-red-600 line-through">
                    {contact.Name} - {contact.Relation} - {contact.Phone}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {newContacts.length > 0 && (
            <div>
              <span className="font-medium text-gray-600 block mb-2">New Contacts:</span>
              <div className="space-y-1 pl-4">
                {newContacts.map((contact: any, index: number) => (
                  <div key={index} className="text-green-600 font-medium">
                    {contact.Name} - {contact.Relation} - {contact.Phone}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {data.UpdatedAt && (
            <div className="flex items-start gap-2 pt-2 border-t">
              <span className="font-medium text-gray-600 min-w-[120px]">Updated At:</span>
              <span>{formatDate(data.UpdatedAt)}</span>
            </div>
          )}
        </div>
      );
    }

    // For SensitiveInfoUpdateRequested event
    if (eventType === 'SensitiveInfoUpdateRequested') {
      const changes = data.Changes || {};
      
      return (
        <div className="mt-2 space-y-2 text-sm">
          <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-2">
            <span className="font-medium text-orange-800">⚠️ Sensitive Information Change Request</span>
            <p className="text-xs text-orange-600 mt-1">Status: {data.Status || 'Pending HR Approval'}</p>
          </div>
          
          {Object.keys(changes).map((fieldName, index) => {
            const change = changes[fieldName];
            return (
              <div key={index} className="flex items-start gap-2">
                <span className="font-medium text-gray-600 min-w-[120px]">{fieldName}:</span>
                <div>
                  {change.Old && <span className="line-through text-red-600">{change.Old}</span>}
                  {change.Old && change.New && <span className="mx-2">→</span>}
                  {change.New && <span className="text-green-600">{change.New}</span>}
                </div>
              </div>
            );
          })}
          
          {data.RequestedAt && (
            <div className="flex items-start gap-2 pt-2 border-t">
              <span className="font-medium text-gray-600 min-w-[120px]">Requested At:</span>
              <span>{formatDate(data.RequestedAt)}</span>
            </div>
          )}
        </div>
      );
    }

    // For EmployeeCreated or EmployeeImported
    if (eventType === 'EmployeeCreated' || eventType === 'EmployeeImported') {
      // Helper to render sensitive fields with toggle
      const renderSensitive = (label: string, value: string, key: string) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}:</span>{' '}
          <span className="select-all">
            {showSensitive[key]
              ? value
              : <span className="select-none font-mono tracking-widest">{'*'.repeat(Math.max(8, value?.length || 8))}</span>
            }
          </span>
          <button
            type="button"
            className="ml-1 p-1 rounded hover:bg-gray-100 focus:outline-none"
            onClick={() => toggleSensitive(key)}
            aria-label={showSensitive[key] ? 'Hide' : 'Show'}
          >
            {showSensitive[key] ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
          </button>
        </div>
      );

      return (
        <div className="mt-2 space-y-1 text-sm">
          {data.FirstName && data.LastName && (
            <div><span className="font-medium">Name:</span> {data.FirstName} {data.LastName}</div>
          )}
          {data.FullName && !data.FirstName && !data.LastName && (
            <div><span className="font-medium">Name:</span> {data.FullName}</div>
          )}
          {data.Email && (
            <div><span className="font-medium">Email:</span> {data.Email}</div>
          )}
          {data.Phone && (
            <div><span className="font-medium">Phone:</span> {data.Phone}</div>
          )}
          {data.HireDate && (
            <div><span className="font-medium">Hire Date:</span> {data.HireDate}</div>
          )}
          {data.PersonalEmail && renderSensitive('Personal Email', data.PersonalEmail, `PersonalEmail-${eventIndex}`)}
          {data.Department && (
            <div><span className="font-medium">Department:</span> {data.Department}</div>
          )}
          {data.Manager && (
            <div><span className="font-medium">Manager:</span> {data.Manager}</div>
          )}
          {data.BankAccountNumber && renderSensitive('Bank Account', data.BankAccountNumber, `BankAccountNumber-${eventIndex}`)}
          {data.TaxID && renderSensitive('Tax ID', data.TaxID, `TaxID-${eventIndex}`)}
          {data.CurrentPoints !== undefined && (
            <div><span className="font-medium">Current Points:</span> {data.CurrentPoints}</div>
          )}
          {data.AvatarUrl && (
            <div><span className="font-medium">Avatar:</span> <a href={data.AvatarUrl} target="_blank" rel="noopener noreferrer">View</a></div>
          )}
        </div>
      );
    }

    // Default: Show JSON
    return (
      <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/profile')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Profile Change History</h1>
          </div>
          <Badge variant="outline" className="text-sm">
            {events.length} Events
          </Badge>
        </div>

        {/* Timeline */}
        {events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No history available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => {
              const eventData = parseEventData(event.data);
              return (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="bg-white pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getEventIcon(event.eventName)}</div>
                        <div>
                          <CardTitle className="text-lg">
                            <Badge className={getEventColor(event.eventName)}>
                              {event.eventName}
                            </Badge>
                          </CardTitle>
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(event.time)}</span>
                            <span className="text-gray-400">•</span>
                            <span>Version {event.version}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {renderEventData(event.eventName, eventData, index)}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
