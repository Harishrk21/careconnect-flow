import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Search,
  Eye,
  Download,
  Calendar,
  User,
  FolderKanban,
  Filter,
  FileCheck,
  Archive,
  Image as ImageIcon,
  File,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  DOCUMENT_TYPE_LABELS, 
  REQUIRED_DOCUMENTS,
  STATUS_LABELS,
  type DocumentType,
  type Document,
  type Case,
} from '@/types';
import { cn } from '@/lib/utils';

interface DocumentWithCase extends Document {
  caseId: string;
  caseStatus: string;
  patientName: string;
  casePriority: string;
}

const Documents: React.FC = () => {
  const { user } = useAuth();
  const { cases, users, isLoading } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithCase | null>(null);

  // Flatten all documents from all cases with case information
  const allDocuments = useMemo(() => {
    const docs: DocumentWithCase[] = [];
    
    // Filter cases based on user role
    const userCases = user?.role === 'admin' 
      ? cases
      : user?.role === 'agent'
      ? cases.filter(c => c.agentId === user.id)
      : user?.role === 'hospital'
      ? cases.filter(c => c.assignedHospital === user.hospitalId)
      : [];
    
    userCases.forEach((caseItem) => {
      caseItem.documents.forEach((doc) => {
        docs.push({
          ...doc,
          caseId: caseItem.id,
          caseStatus: caseItem.status,
          patientName: caseItem.clientInfo.name,
          casePriority: caseItem.priority,
        });
      });
    });
    
    return docs;
  }, [cases, user]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        searchQuery === '' ||
        doc.name.toLowerCase().includes(searchLower) ||
        DOCUMENT_TYPE_LABELS[doc.type].toLowerCase().includes(searchLower) ||
        doc.patientName.toLowerCase().includes(searchLower) ||
        doc.caseId.toLowerCase().includes(searchLower) ||
        (doc.extractedText && doc.extractedText.toLowerCase().includes(searchLower));
      
      // Document type filter
      const matchesType = docTypeFilter === 'all' || doc.type === docTypeFilter;
      
      // Case status filter
      const matchesStatus = statusFilter === 'all' || doc.caseStatus === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [allDocuments, searchQuery, docTypeFilter, statusFilter]);

  // Document statistics
  const documentStats = useMemo(() => {
    const total = allDocuments.length;
    const byType: Record<string, number> = {};
    const withExtractedText = allDocuments.filter(d => d.extractedText).length;
    const totalSize = allDocuments.reduce((sum, d) => sum + d.size, 0);
    
    allDocuments.forEach(doc => {
      byType[doc.type] = (byType[doc.type] || 0) + 1;
    });
    
    return {
      total,
      withExtractedText,
      totalSize,
      byType,
    };
  }, [allDocuments]);

  // Get unique document types for filter
  const availableDocTypes = useMemo(() => {
    const types = new Set(allDocuments.map(d => d.type));
    return Array.from(types).sort();
  }, [allDocuments]);

  // Get unique case statuses for filter
  const availableStatuses = useMemo(() => {
    const statuses = new Set(allDocuments.map(d => d.caseStatus));
    return Array.from(statuses).sort();
  }, [allDocuments]);

  const handleViewDocument = (doc: DocumentWithCase) => {
    setSelectedDocument(doc);
    setViewDialogOpen(true);
  };

  const handleDownloadDocument = (doc: DocumentWithCase) => {
    if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: 'Download Started',
        description: `Downloading ${doc.name}`,
      });
    } else {
      toast({
        title: 'File Not Available',
        description: 'Document file data is not available',
        variant: 'destructive',
      });
    }
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType === 'application/pdf') return FileText;
    return File;
  };

  const getUploaderName = (userId: string) => {
    const uploader = users.find(u => u.id === userId);
    return uploader?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-muted-foreground">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all documents across all cases
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-3xl font-bold text-foreground mt-1">{documentStats.total}</p>
              </div>
              <Archive className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Extracted Text</p>
                <p className="text-3xl font-bold text-foreground mt-1">{documentStats.withExtractedText}</p>
              </div>
              <FileCheck className="w-8 h-8 text-medical-safe opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {(documentStats.totalSize / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <FileText className="w-8 h-8 text-secondary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Filtered Results</p>
                <p className="text-3xl font-bold text-foreground mt-1">{filteredDocuments.length}</p>
              </div>
              <Filter className="w-8 h-8 text-medical-info opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by document name, type, patient name, case ID, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableDocTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {DOCUMENT_TYPE_LABELS[type as DocumentType]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Case Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-foreground">All Documents ({filteredDocuments.length})</CardTitle>
          <CardDescription>
            Documents from all cases. Click on a case to view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length > 0 ? (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Case / Patient</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments
                    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                    .map((doc) => {
                      const Icon = getDocumentIcon(doc.mimeType);
                      const isRequired = REQUIRED_DOCUMENTS.includes(doc.type);
                      
                      return (
                        <TableRow key={`${doc.caseId}-${doc.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-sm">
                                  {doc.name}
                                </p>
                                {doc.extractedText && (
                                  <p className="text-xs text-medical-safe flex items-center gap-1 mt-0.5">
                                    <FileCheck className="w-3 h-3" />
                                    Text extracted
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="outline" className="text-xs">
                                {DOCUMENT_TYPE_LABELS[doc.type]}
                              </Badge>
                              {isRequired && (
                                <Badge variant="destructive" className="text-xs ml-1">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link
                              to={`/cases/${doc.caseId}`}
                              className="hover:text-primary transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FolderKanban className="w-3 h-3 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">{doc.patientName}</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {doc.caseId.slice(-7).toUpperCase()}
                                  </p>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs mt-1"
                                  >
                                    {STATUS_LABELS[doc.caseStatus as keyof typeof STATUS_LABELS]}
                                  </Badge>
                                </div>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span>{getUploaderName(doc.uploadedBy)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {doc.fileData && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewDocument(doc)}
                                    title="View document"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadDocument(doc)}
                                    title="Download document"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {!doc.fileData && (
                                <Badge variant="outline" className="text-xs">
                                  No file
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No documents found</p>
              {searchQuery || docTypeFilter !== 'all' || statusFilter !== 'all' ? (
                <p className="text-sm mt-1">Try adjusting your filters</p>
              ) : (
                <p className="text-sm mt-1">Documents will appear here when cases are created</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {selectedDocument && DOCUMENT_TYPE_LABELS[selectedDocument.type]}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument && (
                <div className="space-y-1 mt-2">
                  <p>File: {selectedDocument.name}</p>
                  <p>Case: {selectedDocument.patientName} ({selectedDocument.caseId.slice(-7).toUpperCase()})</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              {/* Document Preview */}
              {selectedDocument.fileData && (
                <div className="border border-border rounded-lg overflow-hidden">
                  {selectedDocument.mimeType.startsWith('image/') ? (
                    <img
                      src={selectedDocument.fileData}
                      alt={selectedDocument.name}
                      className="w-full h-auto max-h-[500px] object-contain"
                    />
                  ) : selectedDocument.mimeType === 'application/pdf' ? (
                    <iframe
                      src={selectedDocument.fileData}
                      className="w-full h-[500px] border-0"
                      title={selectedDocument.name}
                    />
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>Preview not available for this file type</p>
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadDocument(selectedDocument)}
                        className="mt-4"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download to View
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Extracted Text */}
              {selectedDocument.extractedText && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Extracted Text Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">
                        {selectedDocument.extractedText}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Document Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Document Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{DOCUMENT_TYPE_LABELS[selectedDocument.type]}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-medium">{(selectedDocument.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Uploaded By</p>
                      <p className="font-medium">{getUploaderName(selectedDocument.uploadedBy)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Upload Date</p>
                      <p className="font-medium">
                        {new Date(selectedDocument.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">MIME Type</p>
                      <p className="font-medium">{selectedDocument.mimeType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Case Status</p>
                      <Badge variant="outline">
                        {STATUS_LABELS[selectedDocument.caseStatus as keyof typeof STATUS_LABELS]}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                {selectedDocument.fileData && (
                  <Button
                    onClick={() => handleDownloadDocument(selectedDocument)}
                    className="bg-gradient-primary"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button
                  asChild
                  className="bg-gradient-primary"
                >
                  <Link to={`/cases/${selectedDocument.caseId}`}>
                    View Case
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;
