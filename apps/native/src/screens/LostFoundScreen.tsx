import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import type { LostPetReport } from '../types';
import { useStorage } from '../hooks/useStorage';

export default function LostFoundScreen(): React.JSX.Element {
  const [reports, setReports] = useStorage<LostPetReport[]>('lost-found-reports', []);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newReport, setNewReport] = useState({
    petName: '',
    breed: '',
    description: '',
    lastSeenLocation: '',
    contactInfo: '',
  });

  const submitReport = async () => {
    const report: LostPetReport = {
      id: Date.now().toString(),
      ...newReport,
      photo: 'https://via.placeholder.com/300',
      lastSeenDate: new Date().toISOString(),
      reporterId: 'my-user-id',
      reporterName: 'My Name',
      status: 'lost',
      createdAt: new Date().toISOString(),
    };

    await setReports([report, ...reports]);
    setShowReportModal(false);
    setNewReport({
      petName: '',
      breed: '',
      description: '',
      lastSeenLocation: '',
      contactInfo: '',
    });
  };

  const renderReport = ({ item }: { item: LostPetReport }) => (
    <View style={styles.reportCard}>
      <Image source={{ uri: item.photo }} style={styles.reportImage} />
      <View style={styles.reportContent}>
        <View style={styles.reportHeader}>
          <Text style={styles.petName}>{item.petName}</Text>
          <View
            style={[
              styles.statusBadge,
              item.status === 'lost' && styles.lostBadge,
              item.status === 'found' && styles.foundBadge,
              item.status === 'reunited' && styles.reunitedBadge,
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.breed}>{item.breed}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.location}>📍 Last seen: {item.lastSeenLocation}</Text>
        <Text style={styles.date}>{new Date(item.lastSeenDate).toLocaleDateString()}</Text>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lost & Found</Text>
        <TouchableOpacity style={styles.reportButton} onPress={() => setShowReportModal(true)}>
          <Text style={styles.reportButtonText}>+ Report Pet</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No Reports Yet</Text>
            <Text style={styles.emptyText}>
              Report a lost or found pet to help reunite them with their family
            </Text>
          </View>
        }
      />

      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Lost Pet</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.form}>
              <Text style={styles.label}>Pet Name *</Text>
              <TextInput
                style={styles.input}
                value={newReport.petName}
                onChangeText={(text) => setNewReport({ ...newReport, petName: text })}
                placeholder="e.g., Max"
              />

              <Text style={styles.label}>Breed *</Text>
              <TextInput
                style={styles.input}
                value={newReport.breed}
                onChangeText={(text) => setNewReport({ ...newReport, breed: text })}
                placeholder="e.g., Golden Retriever"
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newReport.description}
                onChangeText={(text) => setNewReport({ ...newReport, description: text })}
                placeholder="Describe distinguishing features"
                multiline
              />

              <Text style={styles.label}>Last Seen Location *</Text>
              <TextInput
                style={styles.input}
                value={newReport.lastSeenLocation}
                onChangeText={(text) => setNewReport({ ...newReport, lastSeenLocation: text })}
                placeholder="e.g., Golden Gate Park"
              />

              <Text style={styles.label}>Contact Info *</Text>
              <TextInput
                style={styles.input}
                value={newReport.contactInfo}
                onChangeText={(text) => setNewReport({ ...newReport, contactInfo: text })}
                placeholder="Phone or email"
              />

              <TouchableOpacity style={styles.submitButton} onPress={submitReport}>
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  reportButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  reportImage: {
    width: '100%',
    height: 180,
  },
  reportContent: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lostBadge: {
    backgroundColor: '#FF5722',
  },
  foundBadge: {
    backgroundColor: '#2196F3',
  },
  reunitedBadge: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  breed: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  contactButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FF5722',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
