import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import SuperAdminSidebar from '../components/SuperAdminSidebar';

export default function AddEmployee({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('employee');
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    password: '',
    jobRole: '',
    assignedSiteLocation: '',
    workingSchedule: '',
    adminAccessApproved: false
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phoneNumber: '',
      email: '',
      password: '',
      jobRole: '',
      assignedSiteLocation: '',
      workingSchedule: '',
      adminAccessApproved: false
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { name, phoneNumber, email, password, jobRole, assignedSiteLocation, workingSchedule } = formData;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter employee name');
      return false;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter email address');
      return false;
    }
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (!jobRole.trim()) {
      Alert.alert('Error', 'Please enter job role');
      return false;
    }
    if (!assignedSiteLocation.trim()) {
      Alert.alert('Error', 'Please enter assigned site location');
      return false;
    }
    if (!workingSchedule.trim()) {
      Alert.alert('Error', 'Please enter working schedule');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleAddEmployee = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Store the current super admin credentials
      const currentUser = auth.currentUser;
      const superAdminEmail = currentUser.email;
      
      // You'll need to store the super admin password or use a different approach
      // For now, we'll assume the super admin email is known
      const superAdminEmails = ['admin@gmail.com'];
      
      // Create user account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const newUser = userCredential.user;

      // Prepare employee data
      const employeeData = {
        uid: newUser.uid,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        jobRole: formData.jobRole,
        assignedSiteLocation: formData.assignedSiteLocation,
        workingSchedule: formData.workingSchedule,
        type: selectedType,
        action: selectedType === 'admin' ? formData.adminAccessApproved : true,
        createdAt: new Date(),
        createdBy: 'superadmin'
      };

      // Add additional field for admin
      if (selectedType === 'admin') {
        employeeData.adminAccessApproved = formData.adminAccessApproved;
      }

      // Store employee data in Firestore
      await addDoc(collection(db, 'users'), employeeData);

      // Sign out the newly created user immediately
      await signOut(auth);

      // Re-authenticate the super admin
      // Note: This is a simplified approach. In production, you might want to use Firebase Admin SDK
      // For now, we'll let the AuthProvider handle the authentication state
      
      // Show success message and reset form
      Alert.alert(
        'Success',
        `${selectedType === 'admin' ? 'Admin' : 'Employee'} added successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form and stay on the same screen
              resetForm();
              setSelectedType('employee');
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error adding employee:', error);
      let errorMessage = 'Failed to add employee. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = (label, field, placeholder, keyboardType = 'default', secureTextEntry = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={field === 'email' ? 'none' : 'words'}
        autoCorrect={false}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setSidebarVisible(true)}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Add Employee</Text>
          <Text style={styles.headerSubtitle}>Create New Account</Text>
        </View>

        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Type Selection Buttons */}
          <View style={styles.typeSelectionContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'employee' && styles.activeTypeButton
              ]}
              onPress={() => setSelectedType('employee')}
            >
              <Ionicons 
                name="person" 
                size={20} 
                color={selectedType === 'employee' ? '#ffffff' : '#2196F3'} 
              />
              <Text style={[
                styles.typeButtonText,
                selectedType === 'employee' && styles.activeTypeButtonText
              ]}>
                Employee
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'admin' && styles.activeTypeButton
              ]}
              onPress={() => setSelectedType('admin')}
            >
              <Ionicons 
                name="shield-checkmark" 
                size={20} 
                color={selectedType === 'admin' ? '#ffffff' : '#2196F3'} 
              />
              <Text style={[
                styles.typeButtonText,
                selectedType === 'admin' && styles.activeTypeButtonText
              ]}>
                Admin
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {selectedType === 'admin' ? 'Admin' : 'Employee'} Information
            </Text>

            {renderInputField('Full Name', 'name', 'Enter full name')}
            {renderInputField('Phone Number', 'phoneNumber', '+1 234 567 8900', 'phone-pad')}
            {renderInputField('Email Address', 'email', 'example@email.com', 'email-address')}
            {renderInputField('Password', 'password', 'Enter password (min 6 characters)', 'default', true)}
            {renderInputField('Job Role', 'jobRole', 'e.g., Software Developer, Manager')}
            {renderInputField('Assigned Site Location', 'assignedSiteLocation', 'e.g., Head Office, Branch A')}
            {renderInputField('Working Schedule', 'workingSchedule', 'e.g., 9 AM - 5 PM, Mon-Fri')}

            {/* Admin Access Approval Checkbox (only for admin type) */}
            {selectedType === 'admin' && (
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => handleInputChange('adminAccessApproved', !formData.adminAccessApproved)}
                >
                  {formData.adminAccessApproved && (
                    <Ionicons name="checkmark" size={16} color="#2196F3" />
                  )}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Admin access is approved</Text>
              </View>
            )}

            {/* Add Button */}
            <TouchableOpacity
              style={[styles.addButton, loading && styles.disabledButton]}
              onPress={handleAddEmployee}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.addButtonText}>Adding...</Text>
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#ffffff" />
                  <Text style={styles.addButtonText}>
                    Add {selectedType === 'admin' ? 'Admin' : 'Employee'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sidebar */}
      <SuperAdminSidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  menuButton: {
    padding: 8,
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  typeSelectionContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeTypeButton: {
    backgroundColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginLeft: 8,
  },
  activeTypeButtonText: {
    color: '#ffffff',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});