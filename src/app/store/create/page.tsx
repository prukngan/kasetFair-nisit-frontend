// page.tsx
"use client"

import { Button } from "@/components/ui/button"
import { StepIndicator } from "@/components/createStep/step-indicator"
import { StepOneForm } from "@/components/createStep/step-one-form"
import { StepClubInfoForm } from "@/components/createStep/step-club-form"
import { StepTwoForm } from "@/components/createStep/step-two-form"
import { StepThreeForm } from "@/components/createStep/step-three-form"
import {
  useStoreWizardCore,
  useCreateStoreStep,
  useClubInfoStep,
  useStoreDetailsStep,
  useProductStep,
} from "@/hooks/store-wizard"
import { useRouter } from "next/navigation"

export default function StoreCreatePage() {
  const router = useRouter()
  const core = useStoreWizardCore()
  const createStep = useCreateStoreStep(core)
  const clubStep = useClubInfoStep(core)
  const storeDetailsStep = useStoreDetailsStep(core)
  const productStep = useProductStep(core)
  const clubInfo = clubStep.clubInfo

  const {
    storeType,
    storeStatus,
    loadingStatus,
    stepError,
    currentStep,
    layoutStepIndex,
    productStepIndex,
    steps,
  } = core

  if (!storeType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-3xl bg-white/80 p-10 text-center shadow-xl ring-1 ring-emerald-100">
          <h1 className="text-2xl font-semibold text-emerald-900">
            Choose a store type before starting
          </h1>
          {loadingStatus ? (
            <p className="text-sm text-emerald-700">
              Loading your latest store progress...
            </p>
          ) : (
            <>
              <p className="text-sm text-emerald-700">
                Pick the store type so we can show the correct steps.
              </p>
              <div className="grid w-full gap-3 sm:grid-cols-2">
                <Button
                  className="w-full justify-start gap-3 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => createStep.selectStoreType("Nisit")}
                >
                  Student store
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => createStep.selectStoreType("Club")}
                >
                  Organization store
                </Button>
              </div>
              <Button
                variant="ghost"
                className="text-emerald-700 hover:bg-emerald-50"
                onClick={() => router.push("/home")}
              >
                Back to home
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  const allowCreateSubmit = !storeStatus || storeStatus.state === "CreateStore"
  const handleFinalSubmit = () =>
    productStep.submitAll({
      storeStatus,
      storeName: createStep.storeName,
      members: createStep.members,
      layoutDescription: storeDetailsStep.layoutDescription,
      layoutFile: storeDetailsStep.layoutFile,
      products: productStep.products,
      clubInfo: clubStep.clubInfo,
    })

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800">
              Kaset Fair store registration
            </h1>
            <p className="mt-2 text-sm text-emerald-700">
              Complete the steps below. You can return later.
            </p>
            {storeStatus && (
              <p className="mt-2 text-xs uppercase tracking-wide text-emerald-600">
                Current state: {storeStatus.state}
              </p>
            )}
            {stepError && (
              <p className="mt-2 text-xs text-red-600">
                {stepError}
              </p>
            )}
          </div>
          <StepIndicator steps={steps} />
        </header>

        {currentStep === 1 && (
          <StepOneForm
            storeName={createStep.storeName}
            members={createStep.members}
            memberEmailStatuses={createStep.memberEmailStatuses}
            onStoreNameChange={createStep.setStoreName}
            onMemberChange={createStep.handleMemberChange}
            onAddMember={createStep.addMember}
            onRemoveMember={createStep.removeMember}
            onNext={createStep.submitCreateStore}
            saving={createStep.isSubmitting}
            canSubmit={allowCreateSubmit}
            errorMessage={stepError ?? undefined}
          />
        )}

        {storeType === "Club" && currentStep === 2 && (
          <StepClubInfoForm
            organizationName={clubInfo.organizationName}
            presidentFirstName={clubInfo.presidentFirstName}
            presidentLastName={clubInfo.presidentLastName}
            presidentNisitId={clubInfo.presidentNisitId}
            presidentEmail={clubInfo.presidentEmail}
            presidentPhone={clubInfo.presidentPhone}
            applicationFileName={clubInfo.applicationFileName}
            onOrganizationNameChange={(value) => clubStep.updateField("organizationName", value)}
            onPresidentFirstNameChange={(value) => clubStep.updateField("presidentFirstName", value)}
            onPresidentLastNameChange={(value) => clubStep.updateField("presidentLastName", value)}
            onpresidentNisitIdChange={(value) => clubStep.updateField("presidentNisitId", value)}
            onPresidentEmailChange={(value) => clubStep.updateField("presidentEmail", value)}
            onPresidentPhoneChange={(value) => clubStep.updateField("presidentPhone", value)}
            onApplicationFileChange={clubStep.updateApplicationFile}
            onBack={() => core.goToStep(currentStep - 1)}
            onNext={clubStep.submitClubInfo}
            saving={clubStep.isSubmitting}
          />
        )}

        {currentStep === layoutStepIndex && (
          <StepTwoForm
            layoutDescription={storeDetailsStep.layoutDescription}
            layoutFileName={storeDetailsStep.layoutFile?.name ?? null}
            onDescriptionChange={storeDetailsStep.setLayoutDescription}
            onFileChange={storeDetailsStep.setLayoutFile}
            onBack={() => core.goToStep(currentStep - 1)}
            onNext={storeDetailsStep.saveAndContinue}
            saving={storeDetailsStep.isSaving}
          />
        )}

        {currentStep === productStepIndex && (
          <StepThreeForm
            products={productStep.products.map(({ id, name, price, fileName }) => ({
              id,
              name,
              price,
              fileName,
            }))}
            onProductChange={productStep.handleProductChange}
            onProductFileChange={productStep.handleProductFileChange}
            onAddProduct={productStep.addProduct}
            onRemoveProduct={productStep.removeProduct}
            onBack={() => core.goToStep(currentStep - 1)}
            onSubmitAll={handleFinalSubmit}
            saving={productStep.isSubmitting}
          />
        )}
      </div>
    </div>
  )
}
