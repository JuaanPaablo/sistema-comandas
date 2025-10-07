'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ComandaComplete } from '@/lib/services/comandaService';
import { 
  X, User, CreditCard, DollarSign, Smartphone, Calculator, FileText, 
  Percent, Upload, Image, Plus, Minus, Receipt, Banknote, 
  Smartphone as PhoneIcon, Wallet, Trash2, Edit3
} from 'lucide-react';

interface PaymentModalProps {
  comanda: ComandaComplete | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (paymentData: PaymentData) => void;
  loading?: boolean;
}

interface PaymentMethod {
  type: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
  amount: number;
  reference?: string;
  image?: string;
}

interface PaymentData {
  paymentMethods: PaymentMethod[];
  totalPaid: number;
  change?: number;
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  taxSettings: {
    ivaRate: number;
    ivaAmount: number;
    exemptAmount: number;
  };
  clientData: {
    tipoCliente: 'consumidor_final' | 'con_datos';
    ruc?: string;
    razon_social?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };
  notes?: string;
}

export default function PaymentModal({ comanda, isOpen, onClose, onConfirmPayment, loading = false }: PaymentModalProps) {
  const [tipoCliente, setTipoCliente] = useState<'consumidor_final' | 'con_datos'>('consumidor_final');
  const [clientData, setClientData] = useState({
    ruc: '',
    razon_social: '',
    direccion: '',
    telefono: '',
    email: ''
  });
  
  // Configuración de impuestos
  const [ivaRate, setIvaRate] = useState<number>(12);
  const [exemptAmount, setExemptAmount] = useState<number>(0);
  
  // Configuración de descuentos
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  
  // Métodos de pago
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentPaymentType, setCurrentPaymentType] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number>(0);
  const [currentPaymentReference, setCurrentPaymentReference] = useState<string>('');
  const [transferImage, setTransferImage] = useState<string>('');
  
  // Notas adicionales
  const [notes, setNotes] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calcular totales
  const subtotal = comanda?.total_amount || 0;
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discountValue) / 100 
    : discountValue;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxableAmount = subtotalAfterDiscount - exemptAmount;
  const ivaAmount = (taxableAmount * ivaRate) / 100;
  const total = subtotalAfterDiscount + ivaAmount;
  const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
  const change = totalPaid - total;

  useEffect(() => {
    if (comanda) {
      setCurrentPaymentAmount(total);
    }
  }, [comanda, total]);

  const handleInputChange = (field: string, value: string) => {
    setClientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddPaymentMethod = () => {
    if (currentPaymentAmount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    const newPaymentMethod: PaymentMethod = {
      type: currentPaymentType,
      amount: currentPaymentAmount,
      reference: currentPaymentReference,
      image: transferImage
    };

    setPaymentMethods(prev => [...prev, newPaymentMethod]);
    setCurrentPaymentAmount(0);
    setCurrentPaymentReference('');
    setTransferImage('');
  };

  const handleRemovePaymentMethod = (index: number) => {
    setPaymentMethods(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTransferImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPayment = () => {
    if (totalPaid < total) {
      alert('El total pagado debe ser mayor o igual al total a pagar');
      return;
    }

    if (tipoCliente === 'con_datos') {
      if (!clientData.ruc || clientData.ruc.length < 10) {
        alert('El RUC/Cédula debe tener al menos 10 dígitos');
        return;
      }
      if (!clientData.razon_social.trim()) {
        alert('La razón social es obligatoria');
        return;
      }
    }

    const paymentData: PaymentData = {
      paymentMethods,
      totalPaid,
      change: change > 0 ? change : undefined,
      discount: {
        type: discountType,
        value: discountValue,
        reason: discountReason
      },
      taxSettings: {
        ivaRate,
        ivaAmount,
        exemptAmount
      },
      clientData: tipoCliente === 'consumidor_final' 
        ? {
            tipoCliente: 'consumidor_final',
            ruc: '9999999999',
            razon_social: 'CONSUMIDOR FINAL',
            direccion: 'N/A',
            telefono: '',
            email: ''
          }
        : {
            tipoCliente: 'con_datos',
            ruc: clientData.ruc,
            razon_social: clientData.razon_social,
            direccion: clientData.direccion,
            telefono: clientData.telefono,
            email: clientData.email
          },
      notes
    };

    onConfirmPayment(paymentData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!isOpen || !comanda) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Procesar Pago
              </h2>
              <p className="text-sm text-gray-500">Mesa {comanda.table_number} • {comanda.employee_name}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
            variant="ghost"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna Izquierda - Resumen de la Comanda */}
            <div className="space-y-6">
              {/* Resumen de la Comanda */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de la Comanda</h3>
                
                {/* Items de la comanda */}
                <div className="space-y-3 mb-4">
                  {comanda.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.dish_name}</p>
                        <p className="text-sm text-gray-500">{item.quantity}x ${item.unit_price.toFixed(2)}</p>
                      </div>
                      <p className="font-semibold text-gray-900">${item.total_price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Resumen financiero */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Descuento:</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA ({ivaRate}%):</span>
                    <span className="font-medium">${ivaAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span className="text-gray-900">Total a Pagar:</span>
                    <span className="text-blue-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Configuración de Descuentos e Impuestos (Colapsable) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <Percent className="h-4 w-4 mr-2" />
                      Descuentos e Impuestos
                    </span>
                    <Plus className="h-4 w-4 group-open:rotate-45 transition-transform" />
                  </summary>
                  
                  <div className="mt-4 space-y-4">
                    {/* Descuentos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descuento</label>
                      <div className="flex space-x-2 mb-2">
                        <Button
                          onClick={() => setDiscountType('percentage')}
                          className={`text-xs ${
                            discountType === 'percentage'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border'
                          }`}
                        >
                          %
                        </Button>
                        <Button
                          onClick={() => setDiscountType('fixed')}
                          className={`text-xs ${
                            discountType === 'fixed'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border'
                          }`}
                        >
                          $
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="flex-1"
                        />
                        <Input
                          type="text"
                          value={discountReason}
                          onChange={(e) => setDiscountReason(e.target.value)}
                          placeholder="Motivo"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Impuestos */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IVA (%)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={ivaRate}
                          onChange={(e) => setIvaRate(parseFloat(e.target.value) || 0)}
                          placeholder="12"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exento ($)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={exemptAmount}
                          onChange={(e) => setExemptAmount(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {/* Columna Derecha - Configuración de Pago */}
            <div className="space-y-6">
              {/* Tipo de Cliente */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Cliente</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setTipoCliente('consumidor_final')}
                    className={`p-3 text-left ${
                      tipoCliente === 'consumidor_final'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <User className="h-4 w-4 mb-1" />
                    <div>
                      <p className="font-medium text-sm">Consumidor Final</p>
                      <p className="text-xs opacity-75">RUC: 9999999999</p>
                    </div>
                  </Button>
                  <Button
                    onClick={() => setTipoCliente('con_datos')}
                    className={`p-3 text-left ${
                      tipoCliente === 'con_datos'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="h-4 w-4 mb-1" />
                    <div>
                      <p className="font-medium text-sm">Con Datos</p>
                      <p className="text-xs opacity-75">RUC/Cédula</p>
                    </div>
                  </Button>
                </div>

                {/* Datos del Cliente (solo si no es consumidor final) */}
                {tipoCliente === 'con_datos' && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RUC/Cédula <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={clientData.ruc}
                          onChange={(e) => handleInputChange('ruc', e.target.value)}
                          placeholder="1234567890"
                          maxLength={13}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Razón Social <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={clientData.razon_social}
                          onChange={(e) => handleInputChange('razon_social', e.target.value)}
                          placeholder="Nombre o razón social"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <Input
                        type="text"
                        value={clientData.direccion}
                        onChange={(e) => handleInputChange('direccion', e.target.value)}
                        placeholder="Dirección del cliente"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <Input
                          type="tel"
                          value={clientData.telefono}
                          onChange={(e) => handleInputChange('telefono', e.target.value)}
                          placeholder="02-1234567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={clientData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="cliente@email.com"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Agregar Método de Pago */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Método de Pago</h3>
                
                {/* Tipo de pago */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Pago:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => setCurrentPaymentType('efectivo')}
                      className={`p-2 ${
                        currentPaymentType === 'efectivo'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="text-xs">Efectivo</span>
                    </Button>
                    <Button
                      onClick={() => setCurrentPaymentType('tarjeta')}
                      className={`p-2 ${
                        currentPaymentType === 'tarjeta'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      <span className="text-xs">Tarjeta</span>
                    </Button>
                    <Button
                      onClick={() => setCurrentPaymentType('transferencia')}
                      className={`p-2 ${
                        currentPaymentType === 'transferencia'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">Transferencia</span>
                    </Button>
                  </div>
                </div>

                {/* Monto y Referencia */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto:
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentPaymentAmount}
                      onChange={(e) => setCurrentPaymentAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  {(currentPaymentType === 'tarjeta' || currentPaymentType === 'transferencia') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Referencia:
                      </label>
                      <Input
                        type="text"
                        value={currentPaymentReference}
                        onChange={(e) => setCurrentPaymentReference(e.target.value)}
                        placeholder="Número de referencia"
                      />
                    </div>
                  )}
                </div>

                {/* Imagen para transferencia */}
                {currentPaymentType === 'transferencia' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comprobante:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-600 hover:bg-gray-700 text-white text-sm"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Subir
                      </Button>
                      {transferImage && (
                        <div className="flex items-center space-x-1">
                          <Image className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Cargada</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botón agregar */}
                <Button
                  onClick={handleAddPaymentMethod}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={currentPaymentAmount <= 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Pago
                </Button>
              </div>

              {/* Métodos de pago agregados */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagos Agregados</h3>
                {paymentMethods.length === 0 ? (
                  <p className="text-gray-500 text-sm italic text-center py-4">No hay métodos de pago agregados</p>
                ) : (
                  <div className="space-y-2">
                    {paymentMethods.map((pm, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {pm.type === 'efectivo' && <DollarSign className="h-4 w-4 text-green-600" />}
                          {pm.type === 'tarjeta' && <CreditCard className="h-4 w-4 text-blue-600" />}
                          {pm.type === 'transferencia' && <PhoneIcon className="h-4 w-4 text-purple-600" />}
                          <div>
                            <p className="font-medium text-sm capitalize">{pm.type}</p>
                            {pm.reference && (
                              <p className="text-xs text-gray-600">Ref: {pm.reference}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">${pm.amount.toFixed(2)}</span>
                          <Button
                            onClick={() => handleRemovePaymentMethod(index)}
                            className="p-1 text-red-600 hover:text-red-800"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notas adicionales */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones sobre el pago..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows={2}
                />
              </div>

              {/* Resumen de totales y botones */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total a Pagar:</span>
                    <span className="font-semibold">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Pagado:</span>
                    <span className="font-semibold">${totalPaid.toFixed(2)}</span>
                  </div>
                  {change > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Cambio:</span>
                      <span className="font-semibold">${change.toFixed(2)}</span>
                    </div>
                  )}
                  {change < 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Faltan:</span>
                      <span className="font-semibold">${Math.abs(change).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex space-x-3">
                  <Button
                    onClick={onClose}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmPayment}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loading || totalPaid < total}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Confirmar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
