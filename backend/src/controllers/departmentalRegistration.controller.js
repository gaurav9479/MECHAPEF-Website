import crypto from 'crypto';
import Event from '../models/event.model.js';
import DepartmentalRegistration from '../models/departmentalRegistration.model.js';
import APIResponse from '../utils/APIResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/index.js';

const REG_NO_PATTERN = /^[A-Z0-9]{4,20}$/i;
const EMAIL_PATTERN = /^([a-z0-9]+)\.([0-9A-Z]+)@mnnit\.ac\.in$/i;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const normalizeName = (value) => String(value || '')
    .replace(/^\uFEFF/, '')
    .replace(/["'`]/g, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const getEnabledEvent = async (eventId) => {
    const event = await Event.findOne({ _id: eventId, deletedAt: null, registrationMode: 'DepartmentalQR', departmentalRegistrationEnabled: true });
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Departmental registration is not enabled for this event');
    return event;
};

export const endorseDepartmentalRegistration = asyncHandler(async (req, res) => {
    const event = await Event.findOneAndUpdate(
        { _id: req.params.eventId, category: 'Departmental', registrationMode: 'DepartmentalQR', deletedAt: null },
        { departmentalRegistrationEnabled: true },
        { new: true }
    );
    if (!event) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Select Departmental QR mode for a Departmental event first');
    return res.json(new APIResponse(HTTP_STATUS.OK, { eventId: event._id }, 'Departmental QR registration endorsed'));
});

export const createDepartmentalRegistration = asyncHandler(async (req, res) => {
    const { eventId, name, phoneNumber, collegeRegNo, collegeEmail } = req.body;
    const normalizedRegNo = String(collegeRegNo || '').trim().toUpperCase();
    const normalizedEmail = String(collegeEmail || '').trim().toLowerCase();
    const emailMatch = normalizedEmail.match(EMAIL_PATTERN);

    if (!eventId || !name || !phoneNumber || !normalizedRegNo || !normalizedEmail) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Event, name, phone number, registration number and college email are required');
    }
    if (!REG_NO_PATTERN.test(normalizedRegNo)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Enter a valid registration number from the approved student list');
    }
    if (!emailMatch || emailMatch[2].toUpperCase() !== normalizedRegNo) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email must be name.REGNO@mnnit.ac.in and REGNO must match exactly');
    }

    const event = await getEnabledEvent(eventId);
    const allowedStudent = event.departmentalAllowedStudents?.find(student => student.collegeRegNo === normalizedRegNo);
    if (!allowedStudent) throw new ApiError(HTTP_STATUS.FORBIDDEN, 'This registration number is not present in the approved Mechanical student list');
    if (normalizeName(allowedStudent.name) !== normalizeName(name)) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Name does not match the approved student list');
    }
    if (!allowedStudent.branch.toLowerCase().includes('mechanical')) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only approved Mechanical Engineering students can register');
    }
    const existing = await DepartmentalRegistration.findOne({ eventId, collegeRegNo: normalizedRegNo }).select('+qrToken');
    if (existing) {
        const sameDetails = normalizeName(existing.name) === normalizeName(name)
            && existing.phoneNumber === String(phoneNumber).trim()
            && existing.collegeEmail === normalizedEmail;
        if (!sameDetails) {
            throw new ApiError(HTTP_STATUS.CONFLICT, 'This registration number is already registered with different details');
        }
        return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, {
            existing: true,
            registration: { id: existing._id, name: existing.name, collegeRegNo: existing.collegeRegNo, eventId },
            qrToken: existing.qrToken
        }, 'Existing registration found; QR restored'));
    }

    const token = crypto.randomBytes(32).toString('hex');
    const registration = await DepartmentalRegistration.create({
        eventId, name, phoneNumber, collegeRegNo: normalizedRegNo, collegeEmail: normalizedEmail, qrToken: token, qrTokenHash: hashToken(token)
    });

    return res.status(HTTP_STATUS.CREATED).json(new APIResponse(HTTP_STATUS.CREATED, {
        registration: { id: registration._id, name, collegeRegNo: normalizedRegNo, eventId },
        qrToken: token
    }, 'Departmental registration created'));
});

export const uploadDepartmentalAllowlist = asyncHandler(async (req, res) => {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'A student list is required');
    const normalized = students.map(student => ({ name: String(student.name || '').trim(), collegeRegNo: String(student.collegeRegNo || '').trim().toUpperCase(), branch: String(student.branch || '').trim() }));
    if (normalized.some(student => !student.name || !student.collegeRegNo || !student.branch)) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Every student must have name, registration number and branch');
    const event = await Event.findByIdAndUpdate(req.params.eventId, { departmentalAllowedStudents: normalized }, { new: true });
    if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
    return res.json(new APIResponse(HTTP_STATUS.OK, { count: normalized.length }, 'Approved student list uploaded'));
});

export const scanDepartmentalRegistration = asyncHandler(async (req, res) => {
    const token = String(req.body?.token || '').trim();
    if (!token) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'QR token is required');

    const registration = await DepartmentalRegistration.findOne({ qrTokenHash: hashToken(token) });
    if (!registration) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Invalid departmental QR');
    await getEnabledEvent(registration.eventId);

    const now = new Date();
    if (registration.lastScannedAt && now - registration.lastScannedAt < 20 * 60 * 1000) {
        return res.status(HTTP_STATUS.CONFLICT).json(new APIResponse(HTTP_STATUS.CONFLICT, {
            valid: false, reason: 'cooldown', registration: { name: registration.name, collegeRegNo: registration.collegeRegNo }
        }, 'This QR was already scanned recently'));
    }

    registration.firstScannedAt ||= now;
    registration.lastScannedAt = now;
    registration.scanCount += 1;
    await registration.save();
    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, {
        valid: true, registration: { name: registration.name, collegeRegNo: registration.collegeRegNo, phoneNumber: registration.phoneNumber }
    }, 'QR verified successfully'));
});

export const listDepartmentalRegistrations = asyncHandler(async (req, res) => {
    await getEnabledEvent(req.params.eventId);
    const registrations = await DepartmentalRegistration.find({ eventId: req.params.eventId }).sort({ createdAt: -1 }).select('-qrTokenHash');
    return res.json(new APIResponse(HTTP_STATUS.OK, { registrations }, 'Departmental registrations retrieved'));
});
